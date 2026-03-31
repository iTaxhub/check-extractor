/**
 * KYRIQ WEB APP — qb-routes.js
 * ─────────────────────────────────────────────────────────────
 * Express router: QuickBooks OAuth + multi-company management.
 *
 * Mounts at /api/qb  (add to your Express app with):
 *   app.use('/api/qb', require('./qb-routes'));
 *
 * Database assumed: Prisma (swap for your ORM).
 * Expected Prisma models:
 *
 *   model QBConnection {
 *     id           String   @id @default(cuid())
 *     userId       String
 *     realmId      String
 *     companyName  String
 *     accessToken  String
 *     refreshToken String
 *     tokenExpiry  DateTime
 *     createdAt    DateTime @default(now())
 *     updatedAt    DateTime @updatedAt
 *     @@unique([userId, realmId])
 *   }
 *
 *   model QBAccount {
 *     id           String   @id @default(cuid())
 *     connectionId String
 *     qbAccountId  String
 *     name         String
 *     type         String   // 'Bank' | 'Credit Card'
 *     subType      String?
 *     balance      Float    @default(0)
 *     lastFour     String?
 *     connection   QBConnection @relation(fields:[connectionId], references:[id], onDelete:Cascade)
 *     @@unique([connectionId, qbAccountId])
 *   }
 *
 * Required env vars (.env):
 *   QB_CLIENT_ID
 *   QB_CLIENT_SECRET
 *   QB_REDIRECT_URI      — e.g. https://app.kyriq.com/api/qb/callback
 *   SESSION_SECRET       — for express-session / JWT
 */

'use strict';

const express = require('express');
const crypto  = require('crypto');
const fetch   = require('node-fetch');      // or global fetch in Node 18+
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ── QB Constants ───────────────────────────────────────────────
const QB = {
  CLIENT_ID:     process.env.QB_CLIENT_ID,
  CLIENT_SECRET: process.env.QB_CLIENT_SECRET,
  REDIRECT_URI:  process.env.QB_REDIRECT_URI,
  SCOPES:        'com.intuit.quickbooks.accounting openid profile email',

  AUTH_URL:      'https://appcenter.intuit.com/connect/oauth2',
  TOKEN_URL:     'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  REVOKE_URL:    'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
  API_BASE:      'https://quickbooks.api.intuit.com/v3/company',
};

// ── Auth middleware (replace with your actual auth) ────────────
// Assumes req.user = { id: string } from JWT/session middleware upstream
function requireAuth(req, res, next) {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  next();
}


// ══════════════════════════════════════════════════════════════
//  STEP 1 — Redirect user to QuickBooks authorization page
//  GET /api/qb/connect
// ══════════════════════════════════════════════════════════════
router.get('/connect', requireAuth, (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');

  // Store state in session to verify on callback (CSRF protection)
  req.session.qbOAuthState  = state;
  req.session.qbOAuthUserId = req.user.id;

  const url = new URL(QB.AUTH_URL);
  url.searchParams.set('client_id',     QB.CLIENT_ID);
  url.searchParams.set('redirect_uri',  QB.REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope',         QB.SCOPES);
  url.searchParams.set('state',         state);

  res.redirect(url.toString());
});


// ══════════════════════════════════════════════════════════════
//  STEP 2 — Handle QuickBooks OAuth callback
//  GET /api/qb/callback
// ══════════════════════════════════════════════════════════════
router.get('/callback', async (req, res) => {
  const { code, realmId, state, error } = req.query;

  if (error) {
    return res.redirect(`/dashboard?qb_error=${encodeURIComponent(error)}`);
  }

  // Verify CSRF state
  if (!state || state !== req.session.qbOAuthState) {
    return res.status(400).json({ error: 'OAuth state mismatch' });
  }

  const userId = req.session.qbOAuthUserId;
  if (!userId) return res.status(400).json({ error: 'No user in session' });

  // Clean up session state
  delete req.session.qbOAuthState;
  delete req.session.qbOAuthUserId;

  try {
    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Fetch human-readable company name from QB
    const companyName = await fetchCompanyName(realmId, tokens.access_token);

    // Fetch bank + credit card accounts
    const accounts = await fetchCompanyAccounts(realmId, tokens.access_token);

    // Upsert QBConnection (one per user+company, update if already exists)
    const connection = await prisma.qBConnection.upsert({
      where:  { userId_realmId: { userId, realmId } },
      update: {
        companyName,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry:  new Date(Date.now() + tokens.expires_in * 1000),
      },
      create: {
        userId,
        realmId,
        companyName,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry:  new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    // Upsert accounts for this connection
    for (const acct of accounts) {
      await prisma.qBAccount.upsert({
        where:  { connectionId_qbAccountId: { connectionId: connection.id, qbAccountId: acct.id } },
        update: { name: acct.name, type: acct.type, subType: acct.subType, balance: acct.balance, lastFour: acct.lastFour },
        create: { connectionId: connection.id, qbAccountId: acct.id, name: acct.name, type: acct.type, subType: acct.subType || '', balance: acct.balance, lastFour: acct.lastFour },
      });
    }

    // Redirect back to dashboard with success flag
    res.redirect(`/dashboard?qb_connected=${realmId}`);
  } catch (err) {
    console.error('[QB OAuth callback]', err);
    res.redirect(`/dashboard?qb_error=${encodeURIComponent(err.message)}`);
  }
});


// ══════════════════════════════════════════════════════════════
//  GET /api/qb/companies
//  Return all QB companies connected to the logged-in user
// ══════════════════════════════════════════════════════════════
router.get('/companies', requireAuth, async (req, res) => {
  try {
    const connections = await prisma.qBConnection.findMany({
      where:   { userId: req.user.id },
      include: { QBAccount: true },
      orderBy: { companyName: 'asc' },
    });

    const companies = connections.map(conn => ({
      realmId:     conn.realmId,
      companyName: conn.companyName,
      isExpired:   conn.tokenExpiry < new Date(),
      accounts:    conn.QBAccount.map(a => ({
        id:       a.qbAccountId,
        name:     a.name,
        type:     a.type,       // 'Bank' | 'Credit Card'
        subType:  a.subType,
        balance:  a.balance,
        lastFour: a.lastFour,
      })),
    }));

    res.json({ companies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════
//  DELETE /api/qb/companies/:realmId
//  Disconnect (revoke + delete) one QB company
// ══════════════════════════════════════════════════════════════
router.delete('/companies/:realmId', requireAuth, async (req, res) => {
  const { realmId } = req.params;
  try {
    const conn = await prisma.qBConnection.findUnique({
      where: { userId_realmId: { userId: req.user.id, realmId } },
    });
    if (!conn) return res.status(404).json({ error: 'Company not connected' });

    // Revoke token with Intuit
    try {
      const creds = Buffer.from(`${QB.CLIENT_ID}:${QB.CLIENT_SECRET}`).toString('base64');
      await fetch(QB.REVOKE_URL, {
        method: 'POST',
        headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: conn.accessToken }),
      });
    } catch { /* ignore revoke errors */ }

    // Delete from DB (QBAccount rows cascade-deleted)
    await prisma.qBConnection.delete({ where: { id: conn.id } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════
//  POST /api/qb/companies/:realmId/refresh-accounts
//  Re-fetch bank accounts from QB and update the DB
// ══════════════════════════════════════════════════════════════
router.post('/companies/:realmId/refresh-accounts', requireAuth, async (req, res) => {
  const { realmId } = req.params;
  try {
    const conn = await prisma.qBConnection.findUnique({
      where: { userId_realmId: { userId: req.user.id, realmId } },
    });
    if (!conn) return res.status(404).json({ error: 'Company not connected' });

    const token    = await getValidToken(conn);
    const accounts = await fetchCompanyAccounts(realmId, token);

    for (const acct of accounts) {
      await prisma.qBAccount.upsert({
        where:  { connectionId_qbAccountId: { connectionId: conn.id, qbAccountId: acct.id } },
        update: { name: acct.name, balance: acct.balance },
        create: { connectionId: conn.id, qbAccountId: acct.id, name: acct.name, type: acct.type, subType: acct.subType || '', balance: acct.balance, lastFour: acct.lastFour },
      });
    }

    res.json({ accounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════
//  QB API proxy — called by other server routes when they need
//  to query QB on behalf of a user + company.
//
//  Usage (from your other route files):
//    const { qbFetch } = require('./qb-routes');
//    const data = await qbFetch(userId, realmId, '/query?query=...');
// ══════════════════════════════════════════════════════════════

/**
 * Make an authenticated QB API request for a given user + realmId.
 * Handles token refresh automatically.
 */
async function qbFetch(userId, realmId, path, options = {}) {
  const conn = await prisma.qBConnection.findUnique({
    where: { userId_realmId: { userId, realmId } },
  });
  if (!conn) throw new Error(`No QB connection for user ${userId} + realm ${realmId}`);

  const token = await getValidToken(conn);
  const url   = `${QB.API_BASE}/${realmId}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Retry once after a fresh refresh
    const newToken = await refreshConnection(conn);
    const retry    = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${newToken}`, Accept: 'application/json', ...(options.headers || {}) },
    });
    if (!retry.ok) throw new Error(`QB API error ${retry.status}: ${path}`);
    return retry.json();
  }

  if (!res.ok) throw new Error(`QB API error ${res.status}: ${path}`);
  return res.json();
}
module.exports.qbFetch = qbFetch;


// ══════════════════════════════════════════════════════════════
//  Internal helpers
// ══════════════════════════════════════════════════════════════

async function exchangeCodeForTokens(code) {
  const creds = Buffer.from(`${QB.CLIENT_ID}:${QB.CLIENT_SECRET}`).toString('base64');
  const res = await fetch(QB.TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept:         'application/json',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: QB.REDIRECT_URI }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

/** Get a valid token for a connection, refreshing if near expiry */
async function getValidToken(conn) {
  const fiveMinutes = 5 * 60 * 1000;
  if (conn.tokenExpiry > new Date(Date.now() + fiveMinutes)) {
    return conn.accessToken;
  }
  return refreshConnection(conn);
}

/** Refresh tokens for a QBConnection row; updates DB; returns new access token */
async function refreshConnection(conn) {
  const creds = Buffer.from(`${QB.CLIENT_ID}:${QB.CLIENT_SECRET}`).toString('base64');
  const res = await fetch(QB.TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept:         'application/json',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: conn.refreshToken }),
  });

  if (!res.ok) {
    // Mark connection as expired so the UI can prompt re-auth
    await prisma.qBConnection.update({
      where: { id: conn.id },
      data:  { accessToken: '', tokenExpiry: new Date(0) },
    });
    throw new Error(`QB refresh token expired for "${conn.companyName}". User must reconnect.`);
  }

  const tokens = await res.json();
  await prisma.qBConnection.update({
    where: { id: conn.id },
    data:  {
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token || conn.refreshToken,
      tokenExpiry:  new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return tokens.access_token;
}

async function fetchCompanyName(realmId, accessToken) {
  try {
    const res = await fetch(`${QB.API_BASE}/${realmId}/companyinfo/${realmId}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!res.ok) return `Company ${realmId}`;
    const data = await res.json();
    return data.CompanyInfo?.CompanyName || `Company ${realmId}`;
  } catch { return `Company ${realmId}`; }
}

async function fetchCompanyAccounts(realmId, accessToken) {
  try {
    const sql = `SELECT * FROM Account WHERE AccountType IN ('Bank','Credit Card') AND Active = true MAXRESULTS 100`;
    const url = `${QB.API_BASE}/${realmId}/query?query=${encodeURIComponent(sql)}&minorversion=65`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.QueryResponse?.Account || []).map(a => ({
      id:       a.Id,
      name:     a.Name,
      type:     a.AccountType,
      subType:  a.AccountSubType || '',
      balance:  parseFloat(a.CurrentBalance || 0),
      lastFour: (String(a.Name).match(/[·\-\*x]{3,}(\d{4})\s*$/i) || [])[1] || null,
    }));
  } catch { return []; }
}

module.exports = router;
