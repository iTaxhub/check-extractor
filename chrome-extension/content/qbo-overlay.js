/**
 * Kyriq — QBO Content Script
 *
 * Three active integrations with QB Online pages:
 *
 * 1. RECONCILIATION PAGE  (/app/reconcile)
 *    Injects an "Auto-Clear Kyriq Approved" button.
 *    Finds every transaction row whose intuit_id or check_number matches a
 *    Kyriq-approved transaction, then clicks its cleared checkbox.
 *    Solves the Purchase ClearStatus API limitation entirely — the UI can
 *    set it even when the IDS API cannot.
 *
 * 2. BANK FEED / REGISTER  (/app/banking, /app/register)
 *    Injects a "Kyriq ✓" badge on rows whose txnId matches an approved txn.
 *
 * 3. TRANSACTION DETAIL  (/app/expense, /app/check, /app/billpayment, /app/payment)
 *    Injects a status banner at the top of the page showing Kyriq approval state.
 *
 * All three read from the service worker via GET_KYRIQ_APPROVED which merges
 * locally stored approvals with any approved checks found in Supabase.
 */

(function () {
  'use strict';

  if (window.__kyriqInjected) return;
  window.__kyriqInjected = true;

  // ─── Utilities ────────────────────────────────────────────────

  function log(...args)  { console.log('[Kyriq]', ...args); }
  function warn(...args) { console.warn('[Kyriq]', ...args); }

  // ─── Extension context guard ──────────────────────────────────
  // MV3 service workers are ephemeral; after an extension reload the content
  // script's chrome.runtime context becomes permanently invalid. Detect that
  // once and stop all polling so the console isn't flooded.
  let _contextInvalidated = false;
  async function safeSendMessage(msg, timeoutMs = 8000) {
    if (_contextInvalidated) return null;
    try {
      return await Promise.race([
        chrome.runtime.sendMessage(msg),
        new Promise((_, rej) => setTimeout(() => rej(new Error('sendMessage timeout')), timeoutMs)),
      ]);
    } catch (e) {
      if (e?.message?.includes('Extension context invalidated') ||
          e?.message?.includes('context invalidated')) {
        _contextInvalidated = true;
        stopStatusBarRefresh();
        try { _navObserver?.disconnect(); } catch {}
        clearTimeout(_navDebounceTimer);
        log('Extension reloaded — reload this QB page to reconnect Kyriq.');
      } else if (e?.message === 'sendMessage timeout') {
        warn('safeSendMessage timed out for', msg?.type);
      }
      return null;
    }
  }

  /** Wait for an element matching `selector` to appear in the DOM. */
  function waitForEl(selector, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const obs = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) { obs.disconnect(); resolve(found); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout waiting for ${selector}`)); }, timeoutMs);
    });
  }

  /** Normalise a check number: strip leading zeros, trim whitespace. */
  function normNum(s) { return String(s || '').trim().replace(/^0+/, ''); }

  /** Normalise an amount to a 2-dp string for comparison. */
  function normAmt(n) {
    const v = parseFloat(String(n || '').replace(/[^0-9.-]/g, ''));
    return isNaN(v) ? null : Math.abs(v).toFixed(2);
  }

  /** Normalise a payee name for fuzzy comparison. */
  function normPayee(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  }

  /** Extract the payee name from a row.
   *  1. Legacy QB pages with `<a href>` tx-detail anchors → use that link's text.
   *  2. Modern reconcile/register table with `<td class="...payee...">` cells → read that cell.
   *  3. Last-resort scan: any cell whose text looks like a name (letters, multi-char,
   *     not a date/amount/transaction type). */
  function getRowPayee(row) {
    for (const a of row.querySelectorAll('a[href]')) {
      const t = a.textContent.trim();
      if (t.length > 2 && !/^\$?[\d,]+(\.\d{2})?$/.test(t)) return t;
    }
    const payeeCell = row.querySelector(
      '[class*="payee"]:not([class*="header"]):not([class*="Header"]), [class*="Payee"]:not([class*="header"]):not([class*="Header"])'
    );
    if (payeeCell) {
      const t = payeeCell.textContent.trim();
      if (t.length > 2 && !/^\$?[\d,]+(\.\d{2})?$/.test(t)) return t;
    }
    for (const cell of row.querySelectorAll('td, [class*="cell"]')) {
      const t = cell.textContent.trim();
      if (t.length < 3) continue;
      if (/^\d/.test(t)) continue;
      if (!/[a-zA-Z]/.test(t)) continue;
      if (/^(check|deposit|transfer|journal|expense|bill|payment)$/i.test(t)) continue;
      return t;
    }
    return '';
  }

  /** Detect strict money formatting (e.g. "1,200.00", "$845.00", "9,606.93").
   *  Excludes dates like "05/17/2025" that would otherwise look numeric. */
  const MONEY_RE = /^\$?\d{1,3}(?:,\d{3})*\.\d{2}$|^\$?\d+\.\d{2}$/;

  /** First positive dollar amount found in a row's cells. Prefers cells whose
   *  class hints at money (`amount`, `numeric`, `currency`); falls back to any
   *  cell whose text matches a strict money format. */
  function getRowAmt(row) {
    const cells = [...row.querySelectorAll('td, [class*="cell"],[class*="Cell"]')];
    const moneyCells = cells.filter(c => /amount|numeric|currency|money/i.test(c.className));
    for (const cell of (moneyCells.length ? moneyCells : cells)) {
      const text = cell.textContent.trim();
      if (!MONEY_RE.test(text)) continue;
      const amt = normAmt(text.replace(/[$,()]/g, ''));
      if (amt && parseFloat(amt) > 0) return amt;
    }
    return null;
  }

  /**
   * Extract intuit_id from a link href containing ?txnId= or &txnId=
   * QB transaction links look like: /app/expense?txnId=19 or /app/check?txnId=42
   */
  function txnIdFromHref(href) {
    if (!href) return null;
    const m = href.match(/[?&]txnId=(\d+)/i);
    return m ? m[1] : null;
  }

  // ─── Page detection + current account name ────────────────────

  /**
   * Read the account name the user is currently viewing in QB Register/Reconcile.
   * QB shows it in the page heading — e.g. "Checking", "Savings", "Business Checking".
   * Returns null if not determinable (safe fallback: no account scoping applied).
   */
  function getQBAccountName() {
    // Try data-automation-id first (most stable across QB versions)
    const autoEl = document.querySelector(
      '[data-automation-id="page-header"], [data-automation-id="accountName"], ' +
      '[data-testid="account-name"], [data-testid="page-title"]'
    );
    if (autoEl) {
      const txt = autoEl.textContent.trim();
      if (txt && txt.length < 80) return txt;
    }
    // Fallback: first h1/h2 whose text doesn't look like a generic QB nav label
    const SKIP = /^(reconcile|register|banking|transactions|home|dashboard)$/i;
    for (const el of document.querySelectorAll('h1, h2, [class*="pageTitle"],[class*="PageTitle"],[class*="header-title"]')) {
      const txt = el.textContent.trim();
      if (txt && txt.length < 80 && !SKIP.test(txt)) return txt;
    }
    return null;
  }

  /**
   * Returns true when txn.account (from kyriqApproved) is compatible with the
   * page account name. If either side has no account info we allow the match
   * (safe default — intuit_id matches are always trusted regardless).
   */
  function accountMatches(txnAccount, pageAccount) {
    if (!txnAccount || !pageAccount) return true;
    const a = txnAccount.toLowerCase();
    const b = pageAccount.toLowerCase();
    return a.includes(b) || b.includes(a);
  }

  function getPageType() {
    const p = location.pathname + location.search;
    if (/\/reconcile/i.test(p))                                              return 'reconcile';
    if (/\/register/i.test(p))                                               return 'register';
    if (/\/banking|\/bank-transactions/i.test(p))                            return 'bankfeed';
    if (/\/expense|\/check|\/billpayment|\/payment|\/deposit/i.test(p))      return 'txndetail';
    return 'other';
  }

  // ─── Overlay visibility (driven by sidepanel liveness + user setting) ──────
  //
  // The service worker tracks two things:
  //   (1) whether the Kyriq sidepanel is currently open (port connected)
  //   (2) the user's kyriqOverlayMode setting: 'whenOpen' | 'always' | 'never'
  //
  // We apply a `.kyriq-overlay-hidden` class on <html> to hide all overlay
  // UI elements when they shouldn't be visible. Content stays in the DOM —
  // cheap to show/hide.

  let _uiState = { sidepanelOpen: false, overlayMode: 'whenOpen' };

  function shouldShowOverlay(state) {
    if (state.overlayMode === 'never')  return false;
    if (state.overlayMode === 'always') return true;
    return !!state.sidepanelOpen; // 'whenOpen' (default)
  }

  function applyOverlayVisibility() {
    const show = shouldShowOverlay(_uiState);
    document.documentElement.classList.toggle('kyriq-overlay-hidden', !show);
    // Also release the body padding we added for the status bar when hidden.
    if (!show) {
      document.body.style.paddingBottom = '';
    } else if (_statusBarEl) {
      const existing = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
      if (existing < 28) document.body.style.paddingBottom = Math.max(existing, 28) + 'px';
    }
  }

  async function fetchInitialUIState() {
    try {
      const res = await safeSendMessage({ type: 'GET_KYRIQ_UI_STATE' });
      if (res) {
        _uiState.sidepanelOpen = !!res.sidepanelOpen;
        _uiState.overlayMode = res.overlayMode || 'whenOpen';
      }
    } catch { /* SW asleep — defaults are safe */ }
    applyOverlayVisibility();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'KYRIQ_UI_STATE') {
      _uiState.sidepanelOpen = !!msg.sidepanelOpen;
      _uiState.overlayMode   = msg.overlayMode || 'whenOpen';
      applyOverlayVisibility();
    }
    if (msg?.type === 'KYRIQ_APPROVAL_ADDED' && msg.txn) {
      console.log('[Kyriq] received KYRIQ_APPROVAL_ADDED', msg.txn);
      // Invalidate the local cache so the pill button count re-fetches.
      _approvedCache = null;
      _approvedFetchedAt = 0;
      // Immediately click the C button for this row on any open reconcile/register page.
      handleNewApproval(msg.txn);
    }
  });

  let _newApprovalInFlight = false;
  async function handleNewApproval(newTxn) {
    if (_newApprovalInFlight) {
      // Queue a re-run once the current one finishes rather than dropping the approval.
      setTimeout(() => handleNewApproval(newTxn), 600);
      return;
    }
    _newApprovalInFlight = true;
    try {
      await _handleNewApprovalImpl(newTxn);
    } finally {
      _newApprovalInFlight = false;
    }
  }

  async function _handleNewApprovalImpl(newTxn) {
    const pt = getPageType();
    console.log('[Kyriq] handleNewApproval — pageType:', pt, 'txn:', newTxn);
    if (pt !== 'reconcile' && pt !== 'register') {
      console.log('[Kyriq] handleNewApproval — not on reconcile/register, skipping click');
      return;
    }

    // Give React a moment to render before we query rows.
    await new Promise(r => setTimeout(r, 500));

    const lookup = buildLookup([newTxn]);
    const rows   = findReconRows();
    console.log(`[Kyriq] handleNewApproval — scanning ${rows.length} rows for intuit_id=${newTxn.intuit_id}`);
    let cleared  = 0;
    let didClear = false; // only clear the first matching uncleared row per approval

    for (const row of rows) {
      if (didClear) break;
      const match = matchReconRow(row, lookup);
      if (!match) continue;
      console.log('[Kyriq] handleNewApproval — row matched!', { intuit_id: match.intuit_id, doc_number: match.doc_number });
      const btn = row.querySelector('button[data-testid="clear-state-cell"]');
      console.log('[Kyriq] handleNewApproval — clear button:', btn, 'aria-pressed:', btn?.getAttribute('aria-pressed'));
      if (!btn || btn.getAttribute('aria-pressed') === 'true') {
        console.log('[Kyriq] handleNewApproval — row already cleared or no button, skipping');
        continue;
      }
      btn.click();
      highlightRow(row, '#059669');
      cleared++;
      didClear = true;
      console.log(`[Kyriq] handleNewApproval — ✓ clicked C for intuit_id=${newTxn.intuit_id}`);
    }

    console.log(`[Kyriq] handleNewApproval — done: ${cleared} row(s) cleared`);
    // Refresh the pill button so the count reflects the new state.
    _currentPage = null;
    runPageAutomation();
  }

  // ─── Service-worker bridge ────────────────────────────────────

  let _approvedCache = null;
  let _approvedFetchedAt = 0;

  async function getApproved(forceRefresh = false) {
    const AGE = 60_000;
    if (!forceRefresh && _approvedCache && Date.now() - _approvedFetchedAt < AGE) {
      return _approvedCache;
    }
    const empty = { byId: {}, byNum: {}, byAmt: {}, list: [] };
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await safeSendMessage({ type: 'GET_KYRIQ_APPROVED' });
        if (res?.approved) {
          _approvedCache = buildLookup(res.approved);
          _approvedFetchedAt = Date.now();
          return _approvedCache;
        }
        // null response means context invalidated or SW timeout — use stale cache
        break;
      } catch (e) {
        warn(`GET_KYRIQ_APPROVED attempt ${attempt + 1} failed`, e);
        if (attempt < 2) await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    return _approvedCache || empty;
  }

  function buildLookup(list) {
    const byId  = {};
    const byNum = {}; // { [normNum]: txn[] } — multiple txns per check number
    const byAmt = {};
    for (const t of list) {
      if (t.intuit_id) byId[String(t.intuit_id)] = t;
      if (t.doc_number) {
        const k = normNum(t.doc_number);
        (byNum[k] = byNum[k] || []).push(t);
      }
      if (t.amount) {
        const k = normAmt(t.amount);
        if (k && !byAmt[k]) byAmt[k] = t;
      }
    }
    return { byId, byNum, byAmt, list };
  }

  // ─── Status bar (all pages) ───────────────────────────────────

  let _statusBarEl = null;

  function createStatusBar() {
    if (_statusBarEl) return;
    const bar = document.createElement('div');
    bar.id = 'kyriq-status-bar';
    bar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:2147483646',
      'height:28px', 'background:linear-gradient(90deg,#1a1a2e 0%,#16213e 100%)',
      'display:flex', 'align-items:center', 'padding:0 12px', 'gap:8px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'font-size:11px', 'color:#e5e7eb',
      'border-top:1px solid rgba(255,255,255,0.1)',
      'box-shadow:0 -2px 8px rgba(0,0,0,0.3)', 'pointer-events:auto',
    ].join(';');
    bar.innerHTML = `
      <span style="background:rgba(255,255,255,0.15);border-radius:4px;padding:1px 6px;font-weight:700;font-size:10px;letter-spacing:.5px;color:#fff;">K</span>
      <span id="kyriq-sb-company" style="font-weight:600;color:#d1d5db;">Kyriq</span>
      <span id="kyriq-sb-sep" style="color:rgba(255,255,255,0.3);display:none;">·</span>
      <span id="kyriq-sb-account" style="color:#9ca3af;display:none;"></span>
      <span id="kyriq-sb-status" style="margin-left:auto;font-size:10px;"></span>
    `;
    document.body.appendChild(bar);
    _statusBarEl = bar;
    const existing = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
    if (existing < 28) document.body.style.paddingBottom = Math.max(existing, 28) + 'px';
  }

  async function refreshStatusBar() {
    if (!_statusBarEl) return;
    const compEl   = document.getElementById('kyriq-sb-company');
    const statusEl = document.getElementById('kyriq-sb-status');
    try {
      const sessRes = await safeSendMessage({ type: 'GET_SESSION' });
      if (!sessRes?.session) {
        if (compEl) { compEl.textContent = 'Sign in to Kyriq'; compEl.style.color = '#9ca3af'; }
        return;
      }
      const connRes = await safeSendMessage({ type: 'GET_CONNECTIONS' });
      const active  = (connRes?.connections || []).find(c => c.is_active);
      if (!active) {
        if (compEl) { compEl.textContent = 'No QB company connected'; compEl.style.color = '#f59e0b'; }
        return;
      }
      const realmMatch = location.href.match(/company\/(\d+)/);
      const realm = realmMatch ? realmMatch[1] : null;
      const isCurrent = realm && String(active.realm_id) === realm;
      if (compEl) {
        compEl.textContent = active.company_name || `Company ${active.realm_id}`;
        compEl.style.color = isCurrent ? '#d1fae5' : '#fde68a';
      }
      if (statusEl) {
        if (isCurrent) statusEl.innerHTML = '<span style="color:#34d399;">✓ Synced</span>';
        else if (realm) statusEl.innerHTML = '<span style="color:#fbbf24;">⚠ Different company</span>';
        else statusEl.innerHTML = '';
      }
    } catch (e) { warn('refreshStatusBar failed', e?.message); }
  }

  // ═══════════════════════════════════════════════════════════════
  //  1. RECONCILIATION PAGE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Strategy to find reconciliation table rows:
   *  A. Link href contains txnId= → most reliable, extract intuit_id directly
   *  B. Row text contains a check number we recognise
   *  C. Row text contains an amount we recognise
   *
   * QB Online uses React with hashed class names, so we scan the row's full
   * text content and any embedded links rather than relying on class names.
   */
  function findReconRows() {
    const candidates = [
      ...document.querySelectorAll('table tbody tr'),
      ...document.querySelectorAll('[class*="row"],[class*="Row"],[class*="transaction"],[class*="Transaction"]'),
    ];
    return [...new Set(candidates)].filter(el => {
      // Primary filter: only rows that actually have a clearable button.
      // This eliminates section headers, summary rows, and container divs that
      // share "row" in their class name but aren't transaction rows.
      if (el.querySelector('button[data-testid="clear-state-cell"]')) return true;

      // Legacy fallback: has a checkbox or a clearState cell AND multiple columns.
      if (el.querySelector('input[type="checkbox"]')) return true;
      if (el.querySelector('td.clearState, [class*="clearState"]')) return true;

      // For table rows: must have a QB transaction link (txnId= in href) — this
      // avoids picking up header/footer rows that happen to contain numbers.
      const hasLink = [...el.querySelectorAll('a[href]')].some(a => txnIdFromHref(a.getAttribute('href')));
      if (hasLink) return true;

      return false;
    });
  }

  /**
   * Given a row element, return the matching approved-txn record or null.
   * Tries: intuit_id from links → check number text → amount text.
   */
  function matchReconRow(row, lookup) {
    // A. intuit_id from link hrefs — most reliable
    const links = row.querySelectorAll('a[href]');
    for (const a of links) {
      const id = txnIdFromHref(a.getAttribute('href'));
      if (id && lookup.byId[id]) return lookup.byId[id];
    }

    const rowPayee = normPayee(getRowPayee(row));
    const rowAmt   = getRowAmt(row);

    // B. Check number → MUST also match amount or payee. QB can have multiple
    //    rows with the same check number (reissues, voids, different vendors),
    //    so check # alone is never sufficient — we verify amount/payee against
    //    every candidate and only match when the row's data agrees.
    const cells = row.querySelectorAll('td, [class*="cell"],[class*="Cell"]');
    for (const cell of cells) {
      const t = cell.textContent.trim();
      if (!/^\d{1,6}$/.test(t)) continue;
      const candidates = lookup.byNum[normNum(t)];
      if (!candidates?.length) continue;

      // 1. payee + amount — strongest, unambiguous match
      for (const c of candidates) {
        const cp = normPayee(c.payee);
        const ca = normAmt(c.amount);
        if (cp && rowPayee && (rowPayee.includes(cp) || cp.includes(rowPayee))
            && ca && rowAmt && ca === rowAmt) return c;
      }
      // 2. exact amount — reliable since QB row amounts come from the txn itself
      if (rowAmt) {
        for (const c of candidates) {
          const ca = normAmt(c.amount);
          if (ca && ca === rowAmt) return c;
        }
      }
      // 3. payee match only — used when the row's amount cell is unreadable
      if (rowPayee) {
        for (const c of candidates) {
          const cp = normPayee(c.payee);
          if (cp && (rowPayee.includes(cp) || cp.includes(rowPayee))) return c;
        }
      }
      // Same check # but neither amount nor payee match → wrong row, do NOT match.
      return null;
    }

    // C. Amount fallback — only when payee ALSO matches. Amount alone is too
    //    weak: two unrelated txns could share a dollar value.
    if (rowAmt && rowPayee) {
      const c = lookup.byAmt[rowAmt];
      if (c) {
        const cp = normPayee(c.payee);
        if (cp && (rowPayee.includes(cp) || cp.includes(rowPayee))) return c;
      }
    }

    return null;
  }

  /**
   * Find the cleared checkbox (or toggle element) within a row.
   * QB sometimes uses:
   *  - input[type="checkbox"]
   *  - A div/span styled as a checkbox at the start of the row
   *  - A click on the row's first cell
   */
  function findClearedCheckbox(row) {
    // Modern QB: <button data-testid="clear-state-cell" aria-pressed="…"> in td.clearState
    const btn = row.querySelector('button[data-testid="clear-state-cell"]');
    if (btn) return btn.getAttribute('aria-pressed') === 'true' ? null : btn;

    // Legacy fallbacks
    const cb = row.querySelector('input[type="checkbox"]');
    if (cb) return cb.checked ? null : cb;

    const clearTd = row.querySelector('td.clearState, [class*="clearState"]');
    if (clearTd) return clearTd.querySelector('button') || clearTd;

    return null;
  }

  function isAlreadyCleared(row) {
    const btn = row.querySelector('button[data-testid="clear-state-cell"]');
    if (btn) return btn.getAttribute('aria-pressed') === 'true';

    const cb = row.querySelector('input[type="checkbox"]');
    if (cb) return cb.checked;

    const toggle = row.querySelector('[aria-checked="true"],[class*="cleared"],[class*="Cleared"]');
    return !!toggle;
  }

  /** Animate an element out then remove it. */
  function dismissEl(el, delay = 0) {
    if (!el) return;
    setTimeout(() => {
      el.classList.add('kyriq-dismissing');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, delay);
  }

  /** Inject the Kyriq auto-clear button into the reconciliation page header. */
  function injectReconButton(matchCount, totalApproved, onAutoClick, onPreviewClick) {
    const existing = document.getElementById('kyriq-recon-btn-wrap');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'kyriq-recon-btn-wrap';

    const pill = document.createElement('div');
    pill.id = 'kyriq-recon-pill';

    const logo = document.createElement('div');
    logo.className = 'kyriq-k-logo';
    logo.textContent = 'K';

    const count = document.createElement('span');
    count.className = 'kyriq-recon-count';
    count.textContent = matchCount;

    const sub = document.createElement('span');
    sub.className = 'kyriq-recon-sub';
    sub.textContent = `matched · ${totalApproved} approved`;

    const balanceInput = document.createElement('input');
    balanceInput.type = 'number';
    balanceInput.placeholder = 'Ending Bal';
    balanceInput.className = 'kyriq-recon-balance-input';
    balanceInput.title = 'Enter statement ending balance to see difference after clearing';

    const diffSpan = document.createElement('span');
    diffSpan.className = 'kyriq-recon-diff';
    diffSpan.style.display = 'none';

    const previewBtn = document.createElement('button');
    previewBtn.className = 'kyriq-recon-action-btn preview';
    previewBtn.textContent = 'Preview';
    previewBtn.addEventListener('click', onPreviewClick);

    const autoBtn = document.createElement('button');
    autoBtn.className = 'kyriq-recon-action-btn go';
    autoBtn.textContent = matchCount > 0 ? `Auto-Clear ${matchCount}` : 'No matches';
    autoBtn.disabled = matchCount === 0;
    autoBtn.addEventListener('click', () => onAutoClick(balanceInput, diffSpan));

    pill.append(logo, count, sub, balanceInput, diffSpan, previewBtn, autoBtn);
    wrap.appendChild(pill);
    document.body.appendChild(wrap);

    return { wrap, autoBtn };
  }

  function highlightRow(row, color) {
    row.style.outline = `2px solid ${color}`;
    row.style.outlineOffset = '-1px';
    row.style.background = color + '22';
    row.dataset.kyriqHighlighted = '1';
  }

  // ═══════════════════════════════════════════════════════════════
  //  SMART FILL — populate QB transaction-detail fields from Kyriq OCR
  // ═══════════════════════════════════════════════════════════════
  //
  // QB Online uses React; setting .value on an input doesn't update React's
  // internal state. The canonical trick is to call the native setter via the
  // property descriptor, then dispatch 'input' + 'change' so React sees it.

  /** Set a value on a React-controlled input/textarea and notify React. */
  function setReactInputValue(el, value) {
    if (!el) return false;
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    const setter = descriptor && descriptor.set;
    if (!setter) return false;
    setter.call(el, value == null ? '' : String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  /** Find the first input matching any of the candidate selectors. */
  function findInputByLabel(...labelRegexes) {
    const allInputs = document.querySelectorAll('input, textarea');
    for (const el of allInputs) {
      const label = (
        el.getAttribute('aria-label') || el.getAttribute('placeholder') ||
        el.getAttribute('name')       || el.getAttribute('data-automation-id') || ''
      ).toLowerCase();
      if (!label) continue;
      for (const rx of labelRegexes) {
        if (rx.test(label)) return el;
      }
    }
    return null;
  }

  /**
   * Attempt to select an option in a React-powered combobox/dropdown by typing
   * its text. Works for QB's Payee/Vendor/Customer pickers which open on focus
   * and filter as you type.
   */
  async function selectReactDropdownByText(el, text) {
    if (!el || !text) return false;
    el.focus();
    setReactInputValue(el, text);
    // Give QB's fuzzy matcher a moment to render options
    await new Promise(r => setTimeout(r, 450));
    const options = document.querySelectorAll(
      '[role="option"], [role="listbox"] li, [data-automation-id*="option" i]'
    );
    const target = [...options].find(o => (o.textContent || '').trim().toLowerCase().includes(text.toLowerCase()));
    if (target) {
      target.click();
      return true;
    }
    // Fallback: press Enter to accept first match
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    return false;
  }

  /** Main Smart-Fill entry point — called from the txn-detail banner button. */
  async function smartFillFromKyriq(intuitId) {
    const res = await safeSendMessage({ type: 'GET_KYRIQ_MATCH_FOR_TXN', intuitId });
    const match = res?.match;
    if (!match) throw new Error('No Kyriq match found for this transaction');

    const k = match.kyriq_check || {};
    const q = match.qb_entry || {};
    const filled = [];
    const skipped = [];

    // Amount
    const amtEl = findInputByLabel(/amount/i, /total/i);
    const amt = k.amount ?? q.amount;
    if (amtEl && amt != null) {
      if (setReactInputValue(amtEl, parseFloat(amt).toFixed(2))) filled.push('Amount');
      else skipped.push('Amount');
    }

    // Check # / Ref #
    const refEl = findInputByLabel(/^ref/i, /check[ _]?(no|number|#)/i, /reference/i);
    const checkNum = k.check_number || q.check_number;
    if (refEl && checkNum) {
      if (setReactInputValue(refEl, checkNum)) filled.push('Ref #');
      else skipped.push('Ref #');
    }

    // Memo / Description
    const memoEl = findInputByLabel(/memo/i, /description/i);
    const memo = k.memo || q.memo;
    if (memoEl && memo) {
      if (setReactInputValue(memoEl, memo)) filled.push('Memo');
      else skipped.push('Memo');
    }

    // Date (try native date input first, fall back to text MM/DD/YYYY)
    const dateEl = findInputByLabel(/^date/i, /payment date/i, /txn date/i);
    const dt = k.check_date || q.date;
    if (dateEl && dt) {
      const formatted = /^\d{4}-\d{2}-\d{2}$/.test(dt)
        ? dt.slice(5, 7) + '/' + dt.slice(8, 10) + '/' + dt.slice(0, 4)
        : dt;
      if (setReactInputValue(dateEl, formatted)) filled.push('Date');
      else skipped.push('Date');
    }

    // Payee / Vendor (dropdown — best-effort)
    const payeeEl = findInputByLabel(/payee/i, /vendor/i, /customer/i, /who/i);
    const payee = k.payee || q.payee;
    if (payeeEl && payee) {
      const ok = await selectReactDropdownByText(payeeEl, String(payee));
      if (ok) filled.push('Payee');
      else skipped.push('Payee (partial match only)');
    }

    log(`SmartFill: filled=${filled.join(', ') || 'none'}; skipped=${skipped.join(', ') || 'none'}`);
    return { filled, skipped };
  }

  function unhighlightAll() {
    document.querySelectorAll('[data-kyriq-highlighted]').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.background = '';
      delete el.dataset.kyriqHighlighted;
    });
  }

  async function initReconcilePage() {
    // Wait for QB's transaction table to render — retry up to 3 times
    const ROW_SEL = 'table tbody tr, [class*="reconRow"],[class*="ReconRow"],[class*="reconcileRow"]';
    let rowsReady = false;
    for (let t = 0; t < 3 && !rowsReady; t++) {
      try {
        await waitForEl(ROW_SEL, 8000);
        rowsReady = true;
      } catch {
        if (t < 2) {
          log(`Reconcile: table not ready yet (attempt ${t + 1}) — retrying in 2 s`);
          await new Promise(r => setTimeout(r, 2000));
        } else {
          log('Reconcile: no transaction rows found after 3 attempts — will retry on next mutation');
        }
      }
    }

    const lookup = await getApproved();
    const allRows = findReconRows();
    const matched = []; // { row, txn }
    const seenTxnIds = new Set();

    for (const row of allRows) {
      if (isAlreadyCleared(row)) continue; // already checked — skip
      const txn = matchReconRow(row, lookup);
      if (!txn) continue;
      const key = txn.intuit_id || `${txn.doc_number}|${txn.amount}`;
      if (seenTxnIds.has(key)) continue; // same approval already claimed a row
      seenTxnIds.add(key);
      matched.push({ row, txn });
    }

    // Scope to the current bank account register to avoid cross-account false matches
    const pageAccount = getQBAccountName();
    const accountScoped = pageAccount
      ? matched.filter(m => accountMatches(m.txn.account, pageAccount))
      : matched;
    if (pageAccount) {
      log(`Reconcile: account scope = "${pageAccount}", kept ${accountScoped.length}/${matched.length} matches`);
    }
    const matchedFinal = pageAccount ? accountScoped : matched;
    log(`Reconcile: ${allRows.length} rows found, ${lookup.list.length} approved, ${matchedFinal.length} to clear`);

    // Shared click handler — used by both the button and auto-clear below.
    function runReconcileClear(balanceInput, diffSpan) {
      let cleared = 0;
      let clearedTotal = 0;
      unhighlightAll();
      for (const { row, txn } of matchedFinal) {
        const target = findClearedCheckbox(row);
        console.log(`[Kyriq] reconcile row ${txn.intuit_id} (${txn.doc_number}) — target:`, target,
          'aria-pressed:', target?.getAttribute?.('aria-pressed'));
        if (target) {
          target.click();
          if (target.tagName === 'INPUT') target.dispatchEvent(new Event('change', { bubbles: true }));
          highlightRow(row, '#059669');
          cleared++;
          clearedTotal += Math.abs(parseFloat(txn.amount || 0));
          console.log(`[Kyriq] ✓ clicked C on reconcile row ${txn.intuit_id}`);
        } else {
          // Row was matched but React re-rendered it between match and click — skip quietly.
          // findReconRows now filters for clear-button rows, so this should be rare.
          log(`Reconcile: skip row ${txn.intuit_id} — clear button no longer in DOM (React re-render?)`);
        }
      }
      if (reconAutoBtn) {
        reconAutoBtn.textContent = `Cleared ${cleared}`;
        reconAutoBtn.className = 'kyriq-recon-action-btn done';
        reconAutoBtn.disabled = true;
      }
      const endingBal = parseFloat(balanceInput?.value);
      if (!isNaN(endingBal) && diffSpan) {
        const diff = endingBal - clearedTotal;
        const diffAbs = Math.abs(diff);
        diffSpan.textContent = `Diff: ${diff >= 0 ? '+' : '-'}$${diffAbs.toFixed(2)}`;
        diffSpan.className = 'kyriq-recon-diff' + (diffAbs < 0.01 ? ' kyriq-recon-balanced' : '');
        diffSpan.style.display = '';
      }
      dismissEl(reconWrap, 5000);
      log(`Reconcile: clicked cleared on ${cleared} rows, total=$${clearedTotal.toFixed(2)}`);
    }

    const { wrap: reconWrap, autoBtn: reconAutoBtn } = injectReconButton(
      matchedFinal.length,
      lookup.list.length,
      runReconcileClear,
      () => {
        const highlighted = document.querySelectorAll('[data-kyriq-highlighted]');
        if (highlighted.length) { unhighlightAll(); return; }
        for (const { row } of matchedFinal) highlightRow(row, '#f59e0b');
      }
    );

    // Auto-click after 1.5 s so simply navigating to the page is enough.
    if (matchedFinal.length > 0) {
      console.log(`[Kyriq] Reconcile: auto-clicking ${matchedFinal.length} matched rows in 1.5 s`);
      setTimeout(() => runReconcileClear(null, null), 1500);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  2. BANK REGISTER PAGE  (/app/register)
  //
  //  Directly clicks the "C" (Cleared) status cell in each transaction row.
  //  This persists ClearedStatus='Cleared' to QB's backend immediately —
  //  unlike the Reconcile page, which only persists on "Finish Reconciling".
  //
  //  QB's register has a fixed column order:
  //   DATE | REF/TYPE | PAYEE/ACCT | MEMO | PAYMENT | DEPOSIT | <C> | BALANCE
  //  The "C" cell is the second-to-last <td> per row.
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find the cleared-status cell in a register row.
   * QB renders it as a clickable <td> that cycles: blank → C → R → blank.
   * We look for a cell containing exactly "C" or "R", or use the column-index
   * heuristic (second-to-last <td> before the BALANCE column).
   */
  function findRegisterClearedCell(row) {
    // Same DOM as Reconcile: <button data-testid="clear-state-cell" aria-pressed="…">.
    // We return the button itself so .click() never reaches the <td>/row (which would
    // bubble into edit-mode and clobber the memo).
    const btn = row.querySelector('button[data-testid="clear-state-cell"]');
    if (btn) return btn;

    const clearTd = row.querySelector('td.clearState, [class*="clearState"]');
    if (clearTd) return clearTd.querySelector('button') || clearTd;

    return null;
  }

  function isRegisterRowCleared(row) {
    const btn = row.querySelector('button[data-testid="clear-state-cell"]');
    if (btn) return btn.getAttribute('aria-pressed') === 'true';

    const cell = row.querySelector('td.clearState, [class*="clearState"]');
    const text = (cell?.textContent || '').trim();
    return text === 'C' || text === 'R';
  }

  async function initRegisterPage() {
    let rowsReady = false;
    for (let t = 0; t < 3 && !rowsReady; t++) {
      try {
        await waitForEl('table tbody tr', 8000);
        rowsReady = true;
      } catch {
        if (t < 2) {
          log(`Register: table not ready yet (attempt ${t + 1}) — retrying in 2 s`);
          await new Promise(r => setTimeout(r, 2000));
        } else {
          log('Register: no transaction rows found after 3 attempts — will retry on next mutation');
          return;
        }
      }
    }

    const lookup = await getApproved();
    if (!lookup.list.length) return;

    const allRows = findReconRows();
    const matched = [];
    const seenTxnIds = new Set();

    for (const row of allRows) {
      if (isRegisterRowCleared(row)) continue;
      const txn = matchReconRow(row, lookup);
      if (!txn) continue;
      const key = txn.intuit_id || `${txn.doc_number}|${txn.amount}`;
      if (seenTxnIds.has(key)) continue; // same approval already claimed a row
      seenTxnIds.add(key);
      matched.push({ row, txn });
    }

    // Scope to the current bank account register to avoid cross-account false matches
    const regPageAccount = getQBAccountName();
    const regAccountScoped = regPageAccount
      ? matched.filter(m => accountMatches(m.txn.account, regPageAccount))
      : matched;
    if (regPageAccount) {
      log(`Register: account scope = "${regPageAccount}", kept ${regAccountScoped.length}/${matched.length} matches`);
    }
    const regMatchedFinal = regPageAccount ? regAccountScoped : matched;
    log(`Register: ${allRows.length} rows, ${lookup.list.length} approved, ${regMatchedFinal.length} to mark cleared`);
    if (!regMatchedFinal.length) return;

    // Shared click handler for button and auto-click.
    function runRegisterClear(balanceInput, diffSpan) {
      let cleared = 0;
      let clearedTotal = 0;
      unhighlightAll();
      for (const { row, txn } of regMatchedFinal) {
        const cell = findRegisterClearedCell(row);
        console.log(`[Kyriq] register row ${txn.intuit_id} (${txn.doc_number}) — button:`, cell,
          'aria-pressed:', cell?.getAttribute?.('aria-pressed'));
        if (cell) {
          cell.click();
          highlightRow(row, '#059669');
          cleared++;
          clearedTotal += Math.abs(parseFloat(txn.amount || 0));
          console.log(`[Kyriq] ✓ clicked C on register row ${txn.intuit_id}`);
        } else {
          log(`Register: skip row ${txn.intuit_id} — clear button no longer in DOM (React re-render?)`);
        }
      }
      if (regAutoBtn) {
        regAutoBtn.textContent = `Marked ${cleared}`;
        regAutoBtn.className = 'kyriq-recon-action-btn done';
        regAutoBtn.disabled = true;
      }
      const endingBal = parseFloat(balanceInput?.value);
      if (!isNaN(endingBal) && diffSpan) {
        const diff = endingBal - clearedTotal;
        const diffAbs = Math.abs(diff);
        diffSpan.textContent = `Diff: ${diff >= 0 ? '+' : '-'}$${diffAbs.toFixed(2)}`;
        diffSpan.className = 'kyriq-recon-diff' + (diffAbs < 0.01 ? ' kyriq-recon-balanced' : '');
        diffSpan.style.display = '';
      }
      dismissEl(regWrap, 5000);
      log(`Register: marked cleared on ${cleared} rows, total=$${clearedTotal.toFixed(2)}`);
    }

    const { wrap: regWrap, autoBtn: regAutoBtn } = injectReconButton(
      regMatchedFinal.length,
      lookup.list.length,
      runRegisterClear,
      () => {
        const highlighted = document.querySelectorAll('[data-kyriq-highlighted]');
        if (highlighted.length) { unhighlightAll(); return; }
        for (const { row } of regMatchedFinal) highlightRow(row, '#f59e0b');
      }
    );

    // Auto-click after 1.5 s — navigating to the register page is enough.
    console.log(`[Kyriq] Register: auto-clicking ${regMatchedFinal.length} matched rows in 1.5 s`);
    setTimeout(() => runRegisterClear(null, null), 1500);
  }

  // ═══════════════════════════════════════════════════════════════
  //  4. BANK FEED PAGE  (/app/banking, /app/bank-transactions)
  // ═══════════════════════════════════════════════════════════════

  function injectBadge(row, txn) {
    if (row.querySelector('.kyriq-badge')) return; // already injected
    const badge = document.createElement('span');
    badge.className = 'kyriq-badge';
    const _amt = txn.amount != null ? `$${Math.abs(parseFloat(txn.amount)).toFixed(2)}` : '';
    const _dt  = txn.txn_date || txn.date || '';
    badge.title = [
      'Kyriq Verified ✓',
      txn.doc_number ? `Check #${txn.doc_number}` : '',
      txn.payee      ? `Payee: ${txn.payee}`       : '',
      _amt           ? `Amount: ${_amt}`            : '',
      _dt            ? `Date: ${_dt}`               : '',
    ].filter(Boolean).join('\n');
    badge.textContent = 'Verified';
    // Append after first visible text cell
    const cells = row.querySelectorAll('td, [class*="cell"],[class*="Cell"]');
    const payeeCell = [...cells].find(c => c.textContent.trim().length > 3);
    if (payeeCell) payeeCell.appendChild(badge);
  }

  async function initBankFeedPage() {
    try { await waitForEl('table tbody tr, [class*="txn-row"],[class*="TxnRow"]', 8000); }
    catch { return; }

    const lookup = await getApproved();
    if (!lookup.list.length) return;

    const rows = document.querySelectorAll('table tbody tr, [class*="bankTxnRow"],[class*="BankTxnRow"]');
    let badged = 0;
    for (const row of rows) {
      const txn = matchReconRow(row, lookup);
      if (txn) { injectBadge(row, txn); badged++; }
    }
    if (badged) log(`Bank feed: injected ${badged} Kyriq badges`);
  }

  // ═══════════════════════════════════════════════════════════════
  //  5. TRANSACTION DETAIL PAGE
  // ═══════════════════════════════════════════════════════════════

  async function initTransactionDetailPage() {
    // Extract txnId from the URL
    const id = txnIdFromHref(location.href) || txnIdFromHref(location.search);
    if (!id) return;

    const lookup = await getApproved();
    const txn = lookup.byId[id];
    if (!txn) return; // only inject for Kyriq-verified transactions

    // Wait for QB's page header area to render
    const headerSel = 'h1,[class*="headerTitle"],[class*="PageHeader"],[data-automation-id*="title"]';
    let anchor;
    try { anchor = await waitForEl(headerSel, 5000); }
    catch { anchor = document.querySelector('main, #root, body'); }

    if (document.getElementById('kyriq-txn-banner')) return;

    const AUTO_DISMISS_MS = 8000;

    // Build field rows for the banner
    const fields = [];
    if (txn.doc_number) fields.push(['Check #', txn.doc_number]);
    if (txn.txn_date || txn.date) fields.push(['Date', txn.txn_date || txn.date]);
    if (txn.payee)    fields.push(['Payee', txn.payee]);
    if (txn.amount)   fields.push(['Amount', `$${Math.abs(parseFloat(txn.amount)).toFixed(2)}`]);
    if (txn.account)  fields.push(['Account', txn.account]);
    if (txn.approved_at) fields.push(['Approved', new Date(txn.approved_at).toLocaleDateString()]);

    const fieldHTML = fields.map(([label, val]) =>
      `<span class="kyriq-field"><span class="kyriq-field-label">${label}</span>${val}</span>`
    ).join('');

    const banner = document.createElement('div');
    banner.id = 'kyriq-txn-banner';
    banner.innerHTML = `
      <span class="kyriq-icon">✅</span>
      <div class="kyriq-body">
        <div class="kyriq-title">
          Verified by Kyriq
          <span class="kyriq-badge-pill">APPROVED</span>
        </div>
        ${fields.length ? `<div class="kyriq-fields">${fieldHTML}</div>` : ''}
        <div class="kyriq-actions">
          <button class="kyriq-smart-fill-btn" data-intuit-id="${id}">⚡ Smart Fill from Kyriq</button>
          <a class="kyriq-open-link" href="https://app.qbo.intuit.com/app/reconcile" target="_blank">Open QB Reconcile →</a>
        </div>
      </div>
      <button class="kyriq-close" title="Dismiss">✕</button>
      <div class="kyriq-progress" style="animation: kyriq-progress ${AUTO_DISMISS_MS / 1000}s linear forwards;"></div>
    `;

    // Close button
    banner.querySelector('.kyriq-close').addEventListener('click', () => dismissEl(banner));

    // Smart-fill button
    banner.querySelector('.kyriq-smart-fill-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '⏳ Filling…';
      try {
        const summary = await smartFillFromKyriq(id);
        btn.textContent = summary.filled.length
          ? `✓ Filled ${summary.filled.length} field${summary.filled.length === 1 ? '' : 's'}`
          : '⚠ No fields matched';
        if (summary.filled.length) {
          // Stop auto-dismiss so user can review
          banner.querySelector('.kyriq-progress')?.remove();
        }
      } catch (err) {
        btn.textContent = `⚠ ${err?.message || 'Fill failed'}`;
      }
    });

    // Auto-dismiss
    dismissEl(banner, AUTO_DISMISS_MS);

    // Insert before the first heading / after body start
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(banner, anchor);
    } else {
      document.body.prepend(banner);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  ROUTING — detect page and initialise the right automation
  // ═══════════════════════════════════════════════════════════════

  let _currentPage = null;

  let _pageAutomationInFlight = false;
  async function runPageAutomation() {
    const page = getPageType();
    if (page === _currentPage) return; // already ran for this page
    if (_pageAutomationInFlight) return; // previous init still running
    _currentPage = page;
    _pageAutomationInFlight = true;
    try {
      if (page === 'reconcile')       { await initReconcilePage(); }
      else if (page === 'register')   { await initRegisterPage(); }
      else if (page === 'bankfeed')   { await initBankFeedPage(); }
      else if (page === 'txndetail')  { await initTransactionDetailPage(); }
    } catch (e) {
      warn('runPageAutomation error', e?.message);
      _currentPage = null; // allow retry on next nav
    } finally {
      _pageAutomationInFlight = false;
    }
  }

  // ─── Detect QB SPA navigation changes ─────────────────────────

  let _lastUrl = location.href;
  let _navDebounceTimer = null;
  const _navObserver = new MutationObserver(() => {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      _currentPage = null; // reset so next navigation re-runs automation
      clearTimeout(_navDebounceTimer); // cancel any in-flight nav timer
      _navDebounceTimer = setTimeout(() => {
        _navDebounceTimer = null;
        refreshStatusBar();
        runPageAutomation();
      }, 1500); // wait for React to render new page content
    }
  });

  // ─── Initialise ───────────────────────────────────────────────

  // Visibility-gated status-bar refresh: skips refresh work when the tab is hidden.
  let _refreshTimer = null;
  function startStatusBarRefresh() {
    if (_refreshTimer) return;
    _refreshTimer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshStatusBar();
    }, 60_000);
  }
  function stopStatusBarRefresh() {
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshStatusBar();
  });
  window.addEventListener('beforeunload', () => {
    stopStatusBarRefresh();
    clearTimeout(_navDebounceTimer);
    try { _navObserver.disconnect(); } catch {}
  });

  function injectOverlayHideStyles() {
    // One-time <style> injection so .kyriq-overlay-hidden hides our DOM.
    // Using display:none prevents interaction and layout — cheaper than removing.
    if (document.getElementById('kyriq-overlay-style')) return;
    const s = document.createElement('style');
    s.id = 'kyriq-overlay-style';
    s.textContent = `
      html.kyriq-overlay-hidden #kyriq-status-bar,
      html.kyriq-overlay-hidden #kyriq-recon-btn-wrap,
      html.kyriq-overlay-hidden #kyriq-txn-banner,
      html.kyriq-overlay-hidden .kyriq-badge { display: none !important; }
    `;
    document.documentElement.appendChild(s);
  }

  function init() {
    injectOverlayHideStyles();
    createStatusBar();
    refreshStatusBar();
    startStatusBarRefresh();
    fetchInitialUIState(); // hide immediately if sidepanel is closed + mode is whenOpen
    _navObserver.observe(document.body, { childList: true, subtree: true });
    runPageAutomation();
    log('Content script loaded — page:', getPageType());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
