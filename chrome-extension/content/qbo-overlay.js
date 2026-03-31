/**
 * Kyriq — QBO Content Script
 * Injects a persistent read-only status bar showing the active company/account context,
 * plus a floating panel with match status summary.
 */

(function () {
  'use strict';

  if (window.__kyriqInjected) return;
  window.__kyriqInjected = true;

  let panelOpen = false;
  let _statusBarEl = null;
  let _statusRefreshTimer = null;

  // ── Detect QB realm and account from page context ─────────────
  function detectPageContext() {
    const href = window.location.href;
    const realmMatch = href.match(/company\/(\d+)/);
    const realm = realmMatch ? realmMatch[1] : null;

    // Try to find the account name from the QB DOM (bank transaction page header)
    let accountName = null;
    const accountSelectors = [
      '[data-automation-id="account-header-name"]',
      '.bankAccountName',
      '.account-name',
      '[class*="BankAccountName"]',
      'h2[class*="account"]',
    ];
    for (const sel of accountSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) { accountName = el.textContent.trim(); break; }
    }

    // Also try to find last-4 digits from the page
    let last4 = null;
    if (!accountName) {
      const bodyText = document.body?.innerText || '';
      const acctMatch = bodyText.match(/\b(\d{4})\b(?=\s*(?:checking|savings|business|account)?)/i);
      if (acctMatch) last4 = acctMatch[1];
    }

    return { realm, accountName, last4 };
  }

  // ── Create / update persistent status bar ─────────────────────
  function createStatusBar() {
    if (_statusBarEl) return;
    const bar = document.createElement('div');
    bar.id = 'kyriq-status-bar';
    bar.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'z-index:2147483646',
      'height:28px',
      'background:linear-gradient(90deg,#1a1a2e 0%,#16213e 100%)',
      'display:flex',
      'align-items:center',
      'padding:0 12px',
      'gap:8px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'font-size:11px',
      'color:#e5e7eb',
      'border-top:1px solid rgba(255,255,255,0.1)',
      'box-shadow:0 -2px 8px rgba(0,0,0,0.3)',
      'pointer-events:auto',
    ].join(';');

    bar.innerHTML = `
      <span style="background:rgba(255,255,255,0.15);border-radius:4px;padding:1px 6px;font-weight:700;font-size:10px;letter-spacing:.5px;color:#fff;">K</span>
      <span id="kyriq-sb-company" style="font-weight:600;color:#d1d5db;">Loading…</span>
      <span id="kyriq-sb-sep" style="color:rgba(255,255,255,0.3);display:none;">·</span>
      <span id="kyriq-sb-account" style="color:#9ca3af;display:none;"></span>
      <span id="kyriq-sb-status" style="margin-left:auto;font-size:10px;"></span>
    `;

    document.body.appendChild(bar);
    _statusBarEl = bar;

    // Add bottom padding to body so QB content isn't hidden behind bar
    const existing = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
    if (existing < 28) document.body.style.paddingBottom = Math.max(existing, 28) + 'px';
  }

  async function refreshStatusBar() {
    if (!_statusBarEl) return;
    const companyEl = document.getElementById('kyriq-sb-company');
    const sepEl = document.getElementById('kyriq-sb-sep');
    const accountEl = document.getElementById('kyriq-sb-account');
    const statusEl = document.getElementById('kyriq-sb-status');
    if (!companyEl) return;

    try {
      const sessionRes = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });
      if (!sessionRes?.session) {
        companyEl.textContent = 'Sign in to Kyriq';
        companyEl.style.color = '#9ca3af';
        if (statusEl) { statusEl.textContent = ''; }
        return;
      }

      const connRes = await chrome.runtime.sendMessage({ type: 'GET_CONNECTIONS' });
      const connections = connRes?.connections || [];
      const active = connections.find(c => c.is_active);

      if (!active) {
        companyEl.textContent = 'No QB company connected';
        companyEl.style.color = '#f59e0b';
        if (statusEl) statusEl.innerHTML = '<span style="color:#f59e0b;">⚠ Connect QB</span>';
        return;
      }

      const { realm: currentRealm, accountName, last4 } = detectPageContext();
      const isCurrentCompany = currentRealm && String(active.realm_id) === String(currentRealm);
      const companyName = active.company_name || `Company ${active.realm_id}`;

      companyEl.textContent = companyName;
      companyEl.style.color = isCurrentCompany ? '#d1fae5' : '#fde68a';

      // Show account if we detected one from the page
      const displayAccount = accountName || (last4 ? `···${last4}` : null);
      if (displayAccount && sepEl && accountEl) {
        sepEl.style.display = '';
        accountEl.textContent = displayAccount;
        accountEl.style.display = '';
      } else if (sepEl && accountEl) {
        sepEl.style.display = 'none';
        accountEl.style.display = 'none';
      }

      if (statusEl) {
        if (isCurrentCompany) {
          statusEl.innerHTML = '<span style="color:#34d399;">✓ Synced</span>';
        } else if (currentRealm) {
          statusEl.innerHTML = '<span style="color:#fbbf24;">⚠ Different company</span>';
        } else {
          statusEl.innerHTML = '<span style="color:#6b7280;">QB</span>';
        }
      }
    } catch (e) {
      if (companyEl) { companyEl.textContent = 'Kyriq'; companyEl.style.color = '#9ca3af'; }
    }
  }

  // ── Create floating action button ────────────────────────────
  function createFAB() {
    if (document.querySelector('.kyriq-fab')) return;
    const fab = document.createElement('button');
    fab.className = 'kyriq-fab';
    fab.innerHTML = 'K';
    fab.title = 'Kyriq';
    // Position above the status bar
    fab.style.bottom = '38px';
    fab.addEventListener('click', togglePanel);
    document.body.appendChild(fab);
  }

  // ── Create panel ─────────────────────────────────────────────
  function createPanel() {
    if (document.querySelector('.kyriq-panel')) return;
    const panel = document.createElement('div');
    panel.className = 'kyriq-panel';
    // Position above status bar
    panel.style.bottom = '28px';
    panel.innerHTML = `
      <div class="kyriq-panel-header">
        <div class="title">
          <span style="width:20px;height:20px;background:rgba(255,255,255,0.2);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;">K</span>
          Kyriq
        </div>
        <button class="close-btn" id="kyriq-close">&times;</button>
      </div>
      <div class="kyriq-panel-body" id="kyriq-body">
        <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px;">
          Loading match data…
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById('kyriq-close').addEventListener('click', () => {
      panel.classList.remove('open');
      panelOpen = false;
    });
  }

  function togglePanel() {
    const panel = document.querySelector('.kyriq-panel');
    if (!panel) return;
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    if (panelOpen) loadPanelData();
  }

  async function loadPanelData() {
    const body = document.getElementById('kyriq-body');
    if (!body) return;
    try {
      const sessionRes = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });
      if (!sessionRes?.session) {
        body.innerHTML = `<div style="text-align:center;padding:20px;">
          <p style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">Not logged in</p>
          <p style="font-size:11px;color:#9ca3af;">Click the Kyriq extension icon to log in.</p>
        </div>`;
        return;
      }

      const connRes = await chrome.runtime.sendMessage({ type: 'GET_CONNECTIONS' });
      const connections = connRes?.connections || [];
      const active = connections.find(c => c.is_active);

      if (!active) {
        body.innerHTML = `<div style="text-align:center;padding:20px;">
          <p style="font-size:13px;font-weight:600;color:#374151;">No QB company connected</p>
          <p style="font-size:11px;color:#9ca3af;margin-top:4px;">Connect via extension side panel.</p>
        </div>`;
        return;
      }

      const { realm: currentRealm, accountName } = detectPageContext();
      const companyName = active.company_name || 'Unknown Company';
      const isCurrentCompany = currentRealm && String(active.realm_id) === String(currentRealm);

      body.innerHTML = `
        <div style="margin-bottom:12px;">
          <div style="font-size:13px;font-weight:700;color:#1a1a2e;">${companyName}</div>
          ${accountName ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">${accountName}</div>` : ''}
          ${isCurrentCompany
            ? '<div style="font-size:10px;color:#059669;font-weight:600;margin-top:4px;">✓ Viewing this company in QB</div>'
            : currentRealm
              ? '<div style="font-size:10px;color:#d97706;font-weight:600;margin-top:4px;">⚠ Different company active in Kyriq</div>'
              : ''
          }
        </div>
        <div class="stat-row">
          <span class="stat-label">Connected companies</span>
          <span class="stat-value">${connections.length}</span>
        </div>
        <div style="padding:12px 0;text-align:center;">
          <p style="font-size:11px;color:#6b7280;">Open the Kyriq side panel for full match controls.</p>
        </div>
        <div style="border-top:1px solid #f3f4f6;padding-top:8px;text-align:center;">
          <span style="font-size:9px;color:#d1d5db;">Kyriq v1.0.0</span>
        </div>
      `;

      injectBadges(active.realm_id);
    } catch (e) {
      console.error('Kyriq panel error:', e);
      body.innerHTML = `<div style="text-align:center;padding:20px;color:#dc2626;font-size:12px;">
        Error loading data: ${e.message}
      </div>`;
    }
  }

  // ── Inject badges into QB transaction rows ───────────────────
  function injectBadges(realmId) {
    const existingBadges = document.querySelectorAll('.kyriq-badge');
    if (existingBadges.length > 0) return;
    console.log('[Kyriq] Active on QBO page. Realm:', realmId);
  }

  // ── Detect QBO navigation changes (SPA) ──────────────────────
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        createFAB();
        refreshStatusBar();
        if (panelOpen) loadPanelData();
      }, 1200);
    }
  });

  // ── Initialize ───────────────────────────────────────────────
  function init() {
    createStatusBar();
    createFAB();
    createPanel();
    refreshStatusBar();
    // Refresh status bar every 60 seconds to stay in sync
    _statusRefreshTimer = setInterval(refreshStatusBar, 60000);
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[Kyriq] Content script loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
