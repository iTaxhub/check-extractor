/**
 * KYRIQ EXTENSION — background.js  (MV3 Service Worker)
 * -------------------------------------------------------
 * Supports MULTIPLE connected QB companies simultaneously.
 * An accountant can connect all their clients once and switch
 * between them without re-authenticating.
 *
 * Storage layout:
 *   kyriq_companies   : { [realmId]: CompanyRecord }
 *   kyriq_active_realm: string   — currently selected realmId
 *   kyriq_token       : string   — Kyriq backend JWT
 *   kyriq_oauth_state : string   — CSRF nonce (cleared after use)
 *
 * CompanyRecord shape:
 *   { realmId, companyName, accessToken, refreshToken,
 *     tokenExpiry, accounts: BankAccount[] }
 *
 * Message API (send from content.js / popup.js):
 *   CONNECT_QB          → add a new QB company via OAuth
 *   DISCONNECT_QB       → { realmId? }  remove one or active company
 *   SWITCH_COMPANY      → { realmId }   change active company
 *   LIST_COMPANIES      → returns all connected CompanyRecords
 *   QB_STATUS           → current company info + token validity
 *   GET_CHECKS          → fetch OCR + run match pass (active company)
 *   APPROVE_CHECK       → { checkId, qbId }
 *   REMATCH_CHECK       → { checkId, data }
 *   AUTO_APPROVE        → { checkIds }
 *   FETCH_QB_TRANSACTIONS → { startDate, endDate }
 *   GET_ACCOUNTS        → list bank/credit accounts for active company
 */

'use strict';

// ── Config ──────────────────────────────────────────────────────
const CONFIG = {
  CLIENT_ID:     'YOUR_INTUIT_CLIENT_ID',      // developer.intuit.com
  CLIENT_SECRET: 'YOUR_INTUIT_CLIENT_SECRET',  // developer.intuit.com
  REDIRECT_URI:  `https://${chrome.runtime.id}.chromiumapp.org/`,
  SCOPES:        'com.intuit.quickbooks.accounting openid profile email',

  AUTH_URL:      'https://appcenter.intuit.com/connect/oauth2',
  TOKEN_URL:     'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  REVOKE_URL:    'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
  USERINFO_URL:  'https://accounts.platform.intuit.com/v1/openid_connect/userinfo',
  QB_API_BASE:   'https://quickbooks.api.intuit.com/v3/company',

  KYRIQ_API:     'https://api.kyriq.com/v1',

  MATCH_AUTO_APPROVE:    95,
  MATCH_REVIEW:          60,
  DUPLICATE_WINDOW_DAYS: 90,
};

// ── Matching weights (must sum to 100) ──────────────────────────
const WEIGHTS = { amount: 40, checkNum: 30, date: 15, payee: 15 };


// ══════════════════════════════════════════════════════════════
//  MULTI-COMPANY STORAGE HELPERS
// ══════════════════════════════════════════════════════════════

/** Return the full companies map from storage */
async function getCompanies() {
  const data = await chrome.storage.local.get('kyriq_companies');
  return data.kyriq_companies || {};
}

/** Persist the full companies map */
async function saveCompanies(map) {
  await chrome.storage.local.set({ kyriq_companies: map });
}

/** Return the active realmId (or null) */
async function getActiveRealm() {
  const data = await chrome.storage.local.get('kyriq_active_realm');
  return data.kyriq_active_realm || null;
}

/** Return the CompanyRecord for the active company (throws if none) */
async function getActiveCompany() {
  const [map, realmId] = await Promise.all([getCompanies(), getActiveRealm()]);
  if (!realmId) throw new Error('No active QuickBooks company. Please connect one.');
  const company = map[realmId];
  if (!company) throw new Error(`Company ${realmId} not found. Please reconnect.`);
  return company;
}

/** Upsert a CompanyRecord and make it active */
async function saveCompany(record) {
  const map = await getCompanies();
  map[record.realmId] = { ...map[record.realmId], ...record };
  await chrome.storage.local.set({
    kyriq_companies:    map,
    kyriq_active_realm: record.realmId,
  });
}

/** Remove a company. If it was active, switch to another or clear. */
async function removeCompany(realmId) {
  const [map, active] = await Promise.all([getCompanies(), getActiveRealm()]);
  delete map[realmId];
  const newActive = active === realmId
    ? (Object.keys(map)[0] || null)
    : active;
  await chrome.storage.local.set({
    kyriq_companies:    map,
    kyriq_active_realm: newActive,
  });
}


// ══════════════════════════════════════════════════════════════
//  QB OAuth 2.0 — supports adding multiple companies
// ══════════════════════════════════════════════════════════════

/**
 * Launch QuickBooks OAuth and store the resulting tokens.
 * Can be called multiple times — each call adds (or refreshes)
 * a company WITHOUT removing existing ones.
 */
async function connectQuickBooks() {
  const state = crypto.randomUUID();
  await chrome.storage.local.set({ kyriq_oauth_state: state });

  const authUrl = new URL(CONFIG.AUTH_URL);
  authUrl.searchParams.set('client_id',     CONFIG.CLIENT_ID);
  authUrl.searchParams.set('redirect_uri',  CONFIG.REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope',         CONFIG.SCOPES);
  authUrl.searchParams.set('state',         state);

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          return reject(new Error(chrome.runtime.lastError?.message || 'Auth cancelled'));
        }
        try {
          const url      = new URL(redirectUrl);
          const code     = url.searchParams.get('code');
          const realmId  = url.searchParams.get('realmId');
          const retState = url.searchParams.get('state');

          // Verify CSRF state
          const { kyriq_oauth_state } = await chrome.storage.local.get('kyriq_oauth_state');
          if (retState !== kyriq_oauth_state) {
            return reject(new Error('OAuth state mismatch — possible CSRF attack'));
          }
          await chrome.storage.local.remove('kyriq_oauth_state');

          // Exchange code for tokens
          const tokens = await exchangeCodeForTokens(code);

          // Fetch QB company info so we have a human-readable name
          const companyName = await fetchCompanyName(realmId, tokens.access_token);

          // Fetch bank/credit accounts for this company
          const accounts = await fetchCompanyAccounts(realmId, tokens.access_token);

          // Persist — existing companies are untouched
          await saveCompany({
            realmId,
            companyName,
            accounts,
            accessToken:  tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiry:  Date.now() + (tokens.expires_in * 1000),
          });

          resolve({ success: true, realmId, companyName });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

async function exchangeCodeForTokens(code) {
  const creds = btoa(`${CONFIG.CLIENT_ID}:${CONFIG.CLIENT_SECRET}`);
  const res = await fetch(CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Accept':        'application/json',
    },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: CONFIG.REDIRECT_URI,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

/** Refresh tokens for a specific company. Returns new access token. */
async function refreshCompanyToken(realmId) {
  const map = await getCompanies();
  const company = map[realmId];
  if (!company?.refreshToken) throw new Error(`No refresh token for ${realmId}`);

  const creds = btoa(`${CONFIG.CLIENT_ID}:${CONFIG.CLIENT_SECRET}`);
  const res = await fetch(CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Accept':        'application/json',
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: company.refreshToken,
    }),
  });

  if (!res.ok) {
    // Refresh token expired (100-day window) — mark company as disconnected
    await saveCompany({ ...company, accessToken: null, refreshToken: null });
    throw new Error(`Token refresh failed for "${company.companyName}". Please reconnect.`);
  }

  const tokens = await res.json();
  const newRecord = {
    ...company,
    accessToken:  tokens.access_token,
    refreshToken: tokens.refresh_token || company.refreshToken,
    tokenExpiry:  Date.now() + (tokens.expires_in * 1000),
  };
  await saveCompany(newRecord);
  return tokens.access_token;
}

/** Revoke tokens and remove a company from storage */
async function disconnectCompany(realmId) {
  const map = await getCompanies();
  const company = map[realmId];
  if (company?.accessToken) {
    try {
      const creds = btoa(`${CONFIG.CLIENT_ID}:${CONFIG.CLIENT_SECRET}`);
      await fetch(CONFIG.REVOKE_URL, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: company.accessToken }),
      });
    } catch { /* ignore revoke errors */ }
  }
  await removeCompany(realmId);
}

/**
 * Get a valid access token for a specific realmId.
 * Auto-refreshes if within 5 minutes of expiry.
 */
async function getTokenForRealm(realmId) {
  const map = await getCompanies();
  const company = map[realmId];
  if (!company?.accessToken) throw new Error(`Not connected to QB for company ${realmId}`);

  if (Date.now() > (company.tokenExpiry - 300_000)) {
    return refreshCompanyToken(realmId);
  }
  return company.accessToken;
}

/** Get a valid token for the currently active company */
async function getActiveToken() {
  const realmId = await getActiveRealm();
  if (!realmId) throw new Error('No active QuickBooks company');
  return getTokenForRealm(realmId);
}


// ══════════════════════════════════════════════════════════════
//  QB Company & Account Info
// ══════════════════════════════════════════════════════════════

/** Fetch the company's display name from QB CompanyInfo */
async function fetchCompanyName(realmId, accessToken) {
  try {
    const url = `${CONFIG.QB_API_BASE}/${realmId}/companyinfo/${realmId}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return `Company ${realmId}`;
    const data = await res.json();
    return data.CompanyInfo?.CompanyName || `Company ${realmId}`;
  } catch {
    return `Company ${realmId}`;
  }
}

/**
 * Fetch all bank and credit-card accounts for a company.
 * Returns array of { id, name, type, subType, balance, lastFour }
 */
async function fetchCompanyAccounts(realmId, accessToken) {
  try {
    const sql = `SELECT * FROM Account WHERE AccountType IN ('Bank','Credit Card') AND Active = true MAXRESULTS 100`;
    const url = `${CONFIG.QB_API_BASE}/${realmId}/query?query=${encodeURIComponent(sql)}&minorversion=65`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rows = data?.QueryResponse?.Account || [];
    return rows.map(a => ({
      id:       a.Id,
      name:     a.Name,
      type:     a.AccountType,         // 'Bank' or 'Credit Card'
      subType:  a.AccountSubType || '',
      balance:  parseFloat(a.CurrentBalance || 0),
      // QB doesn't always store last-4; extract from name if present
      lastFour: extractLastFour(a.Name),
    }));
  } catch {
    return [];
  }
}

function extractLastFour(name) {
  const m = String(name).match(/[·\-\*x]{3,}(\d{4})\s*$/i);
  return m ? m[1] : null;
}


// ══════════════════════════════════════════════════════════════
//  QB API Query Helper
// ══════════════════════════════════════════════════════════════

/**
 * Run a JQL query against the active company.
 * Handles auto-refresh on 401.
 */
async function qbQuery(sql) {
  const realmId = await getActiveRealm();
  if (!realmId) throw new Error('No active QB company');

  const doFetch = async (token) => {
    const url = `${CONFIG.QB_API_BASE}/${realmId}/query?query=${encodeURIComponent(sql)}&minorversion=65`;
    return fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
  };

  let token = await getTokenForRealm(realmId);
  let res   = await doFetch(token);

  if (res.status === 401) {
    // Retry once with a freshly-refreshed token
    token = await refreshCompanyToken(realmId);
    res   = await doFetch(token);
  }
  if (!res.ok) throw new Error(`QB API error ${res.status} for realm ${realmId}`);
  return res.json();
}


// ══════════════════════════════════════════════════════════════
//  QB Data Fetching
// ══════════════════════════════════════════════════════════════

async function fetchQBChecks(startDate, endDate) {
  const sql = `SELECT * FROM Purchase WHERE PaymentType = 'Check' AND TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 1000`;
  const data = await qbQuery(sql);
  return (data?.QueryResponse?.Purchase || []).map(normalizeQBTransaction);
}

async function fetchQBBillPayments(startDate, endDate) {
  const sql = `SELECT * FROM BillPayment WHERE PayType = 'Check' AND TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 1000`;
  const data = await qbQuery(sql);
  return (data?.QueryResponse?.BillPayment || []).map(normalizeQBTransaction);
}

async function fetchQBAllPayments(startDate, endDate) {
  const [checks, bills] = await Promise.all([
    fetchQBChecks(startDate, endDate),
    fetchQBBillPayments(startDate, endDate),
  ]);
  return [...checks, ...bills];
}

function normalizeQBTransaction(txn) {
  return {
    qbId:     txn.Id,
    txnDate:  txn.TxnDate,
    amount:   Math.abs(parseFloat(txn.TotalAmt || txn.Amount || 0)),
    payee:    txn.EntityRef?.name || txn.VendorRef?.name || '',
    checkNum: txn.DocNumber || txn.CheckNum || '',
    memo:     txn.PrivateNote || txn.Memo || '',
    account:  txn.AccountRef?.name || '',
    txnType:  txn.PaymentType || txn.PayType || 'Check',
    rawQB:    txn,
  };
}


// ══════════════════════════════════════════════════════════════
//  Matching Engine
// ══════════════════════════════════════════════════════════════

function matchCheck(ocrCheck, qbTransactions) {
  let best = null, bestScore = 0;
  for (const qb of qbTransactions) {
    const scores = scoreMatch(ocrCheck, qb);
    const total  = scores.amount + scores.checkNum + scores.date + scores.payee;
    if (total > bestScore) { bestScore = total; best = { qb, scores, confidence: total }; }
  }
  const status = bestScore >= CONFIG.MATCH_AUTO_APPROVE ? 'matched'
               : bestScore >= CONFIG.MATCH_REVIEW        ? 'review'
               : 'unmatched';
  return {
    confidence: Math.round(bestScore),
    status,
    qbMatch: best?.qb    || null,
    scores:  best?.scores || { amount: 0, checkNum: 0, date: 0, payee: 0 },
  };
}

function scoreMatch(ocr, qb) {
  return {
    amount:   scoreAmount(ocr.amount,   qb.amount),
    checkNum: scoreCheckNum(ocr.checkNum, qb.checkNum),
    date:     scoreDate(ocr.date,       qb.txnDate),
    payee:    scorePayee(ocr.payee,     qb.payee),
  };
}

function scoreAmount(a, b) {
  const x = parseFloat(String(a).replace(/[^0-9.]/g, '')) || 0;
  const y = parseFloat(String(b).replace(/[^0-9.]/g, '')) || 0;
  if (!x || !y) return 0;
  const d = Math.abs(x - y);
  if (d < 0.01)      return WEIGHTS.amount;
  if (d < 1.00)      return WEIGHTS.amount * 0.8;
  if (d / x < 0.01)  return WEIGHTS.amount * 0.5;
  if (d / x < 0.05)  return WEIGHTS.amount * 0.2;
  return 0;
}

function scoreCheckNum(a, b) {
  if (!a || !b) return 0;
  const x = String(a).replace(/\D/g, '');
  const y = String(b).replace(/\D/g, '');
  if (!x || !y) return 0;
  if (x === y)                     return WEIGHTS.checkNum;
  if (x.slice(-4) === y.slice(-4)) return WEIGHTS.checkNum * 0.5;
  return 0;
}

function scoreDate(a, b) {
  if (!a || !b) return 0;
  const x = new Date(a), y = new Date(b);
  if (isNaN(x) || isNaN(y)) return 0;
  const d = Math.abs((x - y) / 86_400_000);
  if (d < 1)  return WEIGHTS.date;
  if (d <= 3) return WEIGHTS.date * 0.67;
  if (d <= 7) return WEIGHTS.date * 0.33;
  return 0;
}

function scorePayee(a, b) {
  if (!a || !b) return 0;
  const x = normalize(a), y = normalize(b);
  if (!x || !y) return 0;
  if (x === y)                        return WEIGHTS.payee;
  if (x.includes(y) || y.includes(x)) return WEIGHTS.payee * 0.9;
  const sim = jaroSimilarity(x, y);
  if (sim >= 0.92) return WEIGHTS.payee * 0.85;
  if (sim >= 0.80) return WEIGHTS.payee * 0.60;
  if (sim >= 0.70) return WEIGHTS.payee * 0.30;
  const tA = x.split(/\s+/), tB = y.split(/\s+/);
  const overlap = tA.filter(t => tB.includes(t)).length;
  if (overlap > 0) return WEIGHTS.payee * (overlap / Math.max(tA.length, tB.length)) * 0.5;
  return 0;
}

function normalize(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function jaroSimilarity(s1, s2) {
  if (s1 === s2) return 1;
  const l1 = s1.length, l2 = s2.length;
  const dist = Math.max(Math.floor(Math.max(l1, l2) / 2) - 1, 0);
  const m1 = new Array(l1).fill(false), m2 = new Array(l2).fill(false);
  let matches = 0, trans = 0;
  for (let i = 0; i < l1; i++) {
    for (let j = Math.max(0, i - dist); j < Math.min(i + dist + 1, l2); j++) {
      if (m2[j] || s1[i] !== s2[j]) continue;
      m1[i] = m2[j] = true; matches++; break;
    }
  }
  if (!matches) return 0;
  let k = 0;
  for (let i = 0; i < l1; i++) {
    if (!m1[i]) continue;
    while (!m2[k]) k++;
    if (s1[i] !== s2[k]) trans++;
    k++;
  }
  return (matches / l1 + matches / l2 + (matches - trans / 2) / matches) / 3;
}


// ══════════════════════════════════════════════════════════════
//  Duplicate Detection
// ══════════════════════════════════════════════════════════════

function detectDuplicates(ocrChecks, qbTransactions) {
  const flags = {};

  // 1. Same check # in QB more than once
  const qbByNum = groupBy(qbTransactions, t => t.checkNum);
  for (const [num, txns] of Object.entries(qbByNum)) {
    if (!num || txns.length < 2) continue;
    ocrChecks.forEach(ocr => {
      if (String(ocr.checkNum) === String(num)) {
        addFlag(flags, ocr.id, {
          type: 'EXACT_DUPLICATE', severity: 'high',
          message: `Check #${num} appears ${txns.length}× in QuickBooks`,
          qbMatches: txns.map(t => ({ id: t.qbId, date: t.txnDate, amount: t.amount })),
        });
      }
    });
  }

  // 2. Same amount + date in QB more than once
  const qbByAmtDate = groupBy(qbTransactions, t => `${centify(t.amount)}_${t.txnDate}`);
  for (const [key, txns] of Object.entries(qbByAmtDate)) {
    if (txns.length < 2) continue;
    ocrChecks.forEach(ocr => {
      if (`${centify(ocr.amount)}_${ocr.date}` === key) {
        addFlag(flags, ocr.id, {
          type: 'AMOUNT_DATE_DUPLICATE', severity: 'high',
          message: `Same amount $${formatAmt(ocr.amount)} on ${ocr.date} found ${txns.length}× in QB`,
          qbMatches: txns.map(t => ({ id: t.qbId, checkNum: t.checkNum, payee: t.payee })),
        });
      }
    });
  }

  // 3. Same payee + amount within duplicate window (suspicious recurring payments)
  const windowMs = CONFIG.DUPLICATE_WINDOW_DAYS * 86_400_000;
  for (let i = 0; i < ocrChecks.length; i++) {
    for (let j = i + 1; j < ocrChecks.length; j++) {
      const a = ocrChecks[i], b = ocrChecks[j];
      if (centify(a.amount) !== centify(b.amount)) continue;
      if (normalize(a.payee) !== normalize(b.payee)) continue;
      if (Math.abs(new Date(a.date) - new Date(b.date)) > windowMs) continue;
      if (a.checkNum !== b.checkNum) {
        addFlag(flags, a.id, {
          type: 'PAYEE_AMOUNT_DUPLICATE', severity: 'medium',
          message: `Possible duplicate: ${b.payee} $${formatAmt(b.amount)} on ${b.date} (Check #${b.checkNum})`,
          relatedCheckId: b.id,
        });
      }
    }
  }

  // 4. Same check # uploaded twice in the OCR batch
  const ocrByNum = groupBy(ocrChecks, c => c.checkNum);
  for (const [num, checks] of Object.entries(ocrByNum)) {
    if (!num || checks.length < 2) continue;
    checks.forEach(ocr => {
      addFlag(flags, ocr.id, {
        type: 'OCR_BATCH_DUPLICATE', severity: 'medium',
        message: `Check #${num} appears ${checks.length}× in your uploaded batch`,
        duplicateIds: checks.filter(c => c.id !== ocr.id).map(c => c.id),
      });
    });
  }

  return flags;
}

function addFlag(flags, id, flag) {
  if (!flags[id]) flags[id] = [];
  if (!flags[id].some(f => f.type === flag.type && f.message === flag.message))
    flags[id].push(flag);
}
function groupBy(arr, fn) {
  return arr.reduce((acc, item) => {
    const k = fn(item); if (!acc[k]) acc[k] = []; acc[k].push(item); return acc;
  }, {});
}
function centify(v)  { return Math.round(parseFloat(String(v).replace(/[^0-9.]/g, '')) * 100); }
function formatAmt(v){ const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? v : n.toLocaleString('en-US', { minimumFractionDigits: 2 }); }


// ══════════════════════════════════════════════════════════════
//  Full Match Pass
// ══════════════════════════════════════════════════════════════

async function runMatchPass(ocrChecks) {
  const dates = ocrChecks.map(c => new Date(c.date)).filter(d => !isNaN(d));
  if (!dates.length) throw new Error('No valid dates in check data');

  const minD = new Date(Math.min(...dates));
  const maxD = new Date(Math.max(...dates));
  minD.setDate(minD.getDate() - CONFIG.DUPLICATE_WINDOW_DAYS);
  maxD.setDate(maxD.getDate() + 7);

  const qbTransactions = await fetchQBAllPayments(
    minD.toISOString().slice(0, 10),
    maxD.toISOString().slice(0, 10),
  );

  const matchedChecks = ocrChecks.map(ocr => {
    const m = matchCheck(ocr, qbTransactions);
    return {
      ...ocr,
      confidence: m.confidence, status: m.status,
      qbPayee:    m.qbMatch?.payee    || null,
      qbAmount:   m.qbMatch?.amount   || null,
      qbDate:     m.qbMatch?.txnDate  || null,
      qbCheckNum: m.qbMatch?.checkNum || null,
      qbId:       m.qbMatch?.qbId     || null,
      scores:     m.scores,
      duplicates: [],
    };
  });

  const dupFlags = detectDuplicates(ocrChecks, qbTransactions);
  matchedChecks.forEach(c => {
    if (dupFlags[c.id]) {
      c.duplicates = dupFlags[c.id];
      if (c.duplicates.some(d => d.severity === 'high') && c.status === 'matched')
        c.status = 'review';
    }
  });

  const stats = {
    total:      matchedChecks.length,
    matched:    matchedChecks.filter(c => c.status === 'matched').length,
    review:     matchedChecks.filter(c => c.status === 'review').length,
    unmatched:  matchedChecks.filter(c => c.status === 'unmatched').length,
    duplicates: matchedChecks.filter(c => c.duplicates.length > 0).length,
  };
  await chrome.storage.local.set({ kyriq_stats: stats });

  return { checks: matchedChecks, qbTransactions, stats };
}


// ══════════════════════════════════════════════════════════════
//  Kyriq Backend API
// ══════════════════════════════════════════════════════════════

async function getKyriqToken() {
  const { kyriq_token } = await chrome.storage.local.get('kyriq_token');
  return kyriq_token || null;
}

async function kyriqFetch(path, options = {}) {
  const token = await getKyriqToken();
  const res = await fetch(`${CONFIG.KYRIQ_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Kyriq API ${res.status}: ${path}`);
  return res.json();
}


// ══════════════════════════════════════════════════════════════
//  Message Router
// ══════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch(err => { console.error('[Kyriq]', err); sendResponse({ error: err.message }); });
  return true; // keep channel open for async response
});

async function handleMessage({ type, ...args }) {
  switch (type) {

    // ── Connect a new QB company (additive — does not remove others) ──
    case 'CONNECT_QB':
      return connectQuickBooks();

    // ── Disconnect one company (defaults to active) ────────────────
    case 'DISCONNECT_QB': {
      const realmId = args.realmId || await getActiveRealm();
      if (!realmId) return { success: true };
      await disconnectCompany(realmId);
      return { success: true };
    }

    // ── Switch active company ──────────────────────────────────────
    case 'SWITCH_COMPANY': {
      const { realmId } = args;
      const map = await getCompanies();
      if (!map[realmId]) throw new Error(`Company ${realmId} not connected`);
      await chrome.storage.local.set({ kyriq_active_realm: realmId });
      return { success: true, realmId, companyName: map[realmId].companyName };
    }

    // ── List all connected companies ───────────────────────────────
    case 'LIST_COMPANIES': {
      const [map, activeRealm] = await Promise.all([getCompanies(), getActiveRealm()]);
      const companies = Object.values(map).map(c => ({
        realmId:     c.realmId,
        companyName: c.companyName,
        accounts:    c.accounts || [],
        isActive:    c.realmId === activeRealm,
        isConnected: !!(c.accessToken),
        tokenExpiry: c.tokenExpiry || null,
      }));
      return { companies, activeRealm };
    }

    // ── QB + token status ──────────────────────────────────────────
    case 'QB_STATUS': {
      const [map, activeRealm] = await Promise.all([getCompanies(), getActiveRealm()]);
      const active = activeRealm ? map[activeRealm] : null;
      return {
        connected:     !!active?.accessToken,
        realmId:       activeRealm,
        companyName:   active?.companyName || null,
        tokenExpiry:   active?.tokenExpiry || null,
        totalCompanies: Object.keys(map).length,
      };
    }

    // ── Refresh accounts list for a company ───────────────────────
    case 'REFRESH_ACCOUNTS': {
      const realmId = args.realmId || await getActiveRealm();
      if (!realmId) throw new Error('No active company');
      const token    = await getTokenForRealm(realmId);
      const accounts = await fetchCompanyAccounts(realmId, token);
      const map      = await getCompanies();
      if (map[realmId]) {
        map[realmId].accounts = accounts;
        await saveCompanies(map);
      }
      return { accounts };
    }

    // ── Get bank/credit accounts for active company ────────────────
    case 'GET_ACCOUNTS': {
      const realmId = args.realmId || await getActiveRealm();
      const map     = await getCompanies();
      return { accounts: map[realmId]?.accounts || [] };
    }

    // ── Fetch checks + run match pass ─────────────────────────────
    case 'GET_CHECKS': {
      let ocrChecks;
      try {
        const data = await kyriqFetch('/checks');
        ocrChecks = data.checks;
      } catch {
        return { checks: null }; // content.js will show demo data
      }

      const status = await handleMessage({ type: 'QB_STATUS' });
      if (!status.connected) return { checks: ocrChecks, qbConnected: false };

      try {
        const result = await runMatchPass(ocrChecks);
        return { checks: result.checks, stats: result.stats, qbConnected: true };
      } catch (err) {
        console.error('[Kyriq] Match pass failed:', err.message);
        return { checks: ocrChecks, qbConnected: true, matchError: err.message };
      }
    }

    // ── Approve a single check ─────────────────────────────────────
    case 'APPROVE_CHECK': {
      const { checkId, qbId } = args;
      try {
        await kyriqFetch(`/checks/${checkId}/approve`, { method: 'POST' });
        // Note: QB v3 API doesn't expose a direct "mark cleared" endpoint.
        // Cleared/reconciled status is managed through QB's own reconcile UI.
        // Log the qbId so the accountant knows which QB transaction to tick.
        if (qbId) console.log('[Kyriq] Approved — QB txn to mark:', qbId);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // ── Edit OCR data + re-match against QB ───────────────────────
    case 'REMATCH_CHECK': {
      const { checkId, data: editData } = args;
      try {
        await kyriqFetch(`/checks/${checkId}`, { method: 'PATCH', body: JSON.stringify(editData) });
        const status = await handleMessage({ type: 'QB_STATUS' });
        if (status.connected && editData.date) {
          const d = new Date(editData.date);
          const s = new Date(d); s.setDate(d.getDate() - 7);
          const e = new Date(d); e.setDate(d.getDate() + 7);
          const qbTxns = await fetchQBAllPayments(s.toISOString().slice(0,10), e.toISOString().slice(0,10));
          const m = matchCheck({ id: checkId, ...editData }, qbTxns);
          return { check: { id: checkId, ...editData, ...m } };
        }
        return { check: { id: checkId, ...editData } };
      } catch (err) {
        return { error: err.message };
      }
    }

    // ── Auto-approve batch of high-confidence checks ───────────────
    case 'AUTO_APPROVE': {
      const results = await Promise.allSettled(
        (args.checkIds || []).map(id => kyriqFetch(`/checks/${id}/approve`, { method: 'POST' }))
      );
      const approved = (args.checkIds || []).filter((_, i) => results[i].status === 'fulfilled');
      return { approved, total: args.checkIds?.length || 0 };
    }

    // ── Raw QB transactions (debug / manual lookup) ────────────────
    case 'FETCH_QB_TRANSACTIONS': {
      const { startDate, endDate } = args;
      const transactions = await fetchQBAllPayments(startDate, endDate);
      return { transactions };
    }

    default:
      return { error: `Unknown message type: ${type}` };
  }
}

// ── On install: open onboarding page ────────────────────────────
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: 'https://app.kyriq.com/connect-extension' });
  }
});
