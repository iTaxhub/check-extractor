# Kyriq Extension — Backend Integration Guide

This document explains how the Chrome extension integrates with the backend server to fetch configuration and manage credentials securely.

---

## 🏗️ Architecture Overview

The extension uses a **backend-first** architecture where all sensitive credentials are managed server-side:

```
┌─────────────────┐
│ Chrome Extension│
│   (Frontend)    │
└────────┬────────┘
         │
         │ 1. Login (email/password)
         │ 2. Fetch config
         │ 3. API requests
         │
         ▼
┌─────────────────┐
│  Backend Server │
│  (Next.js API)  │
└────────┬────────┘
         │
         │ Provides:
         │ - Supabase credentials
         │ - QB Client ID/Secret
         │ - Gemini API Key
         │
         ▼
┌─────────────────┐
│   Environment   │
│    Variables    │
└─────────────────┘
```

**Benefits:**
- ✅ Users never handle sensitive API keys
- ✅ Centralized credential management
- ✅ Easy rotation without extension updates
- ✅ Better security posture

---

## 🔌 Required Backend API Endpoints

### 1. **GET /api/extension/config**

Returns public configuration needed by the extension.

**Request:**
```http
GET /api/extension/config
Authorization: Bearer <user_session_token>
```

**Response:**
```json
{
  "supabaseUrl": "https://xxxxx.supabase.co",
  "supabaseAnonKey": "eyJhbGci...",
  "qbClientId": "ABc...",
  "geminiApiKey": "AIzaSy..."
}
```

**Note:** QB Client Secret should NOT be exposed to frontend. Token refresh happens server-side.

**Implementation Example (Next.js):**

```typescript
// frontend/pages/api/extension/config.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify user is authenticated
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Return public configuration
  res.status(200).json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    qbClientId: process.env.QB_CLIENT_ID,
    geminiApiKey: process.env.GEMINI_API_KEY,
  });
}
```

---

### 2. **POST /api/extension/qb/refresh-token**

Refreshes QuickBooks OAuth token server-side (keeps client secret secure).

**Request:**
```http
POST /api/extension/qb/refresh-token
Authorization: Bearer <user_session_token>
Content-Type: application/json

{
  "connectionId": "uuid",
  "refreshToken": "refresh_token_string"
}
```

**Response:**
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 3600
}
```

**Implementation Example:**

```typescript
// frontend/pages/api/extension/qb/refresh-token.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { connectionId, refreshToken } = req.body;

  try {
    // Call QuickBooks token endpoint
    const response = await fetch(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens = await response.json();

    // Update in database
    // ... update qb_connections table ...

    res.status(200).json({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 🔧 Extension Service Worker Updates

Update the service worker to fetch config from backend instead of chrome.storage:

### Current Implementation (Manual Config):
```javascript
async function getConfig() {
  const { config } = await chrome.storage.local.get('config');
  return { ...DEFAULTS, ...config };
}
```

### Updated Implementation (Backend Config):
```javascript
let cachedConfig = null;
let configExpiry = 0;

async function getConfig() {
  // Return cached config if still valid (cache for 1 hour)
  if (cachedConfig && Date.now() < configExpiry) {
    return cachedConfig;
  }

  const session = await getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Fetch from backend
  const response = await fetch('https://your-backend.com/api/extension/config', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch config');
  }

  cachedConfig = await response.json();
  configExpiry = Date.now() + 3600000; // Cache for 1 hour

  return cachedConfig;
}
```

### Updated Token Refresh:
```javascript
async function getValidQBToken() {
  const conn = await getActiveConnection();
  const expiresAt = new Date(conn.token_expires_at);
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt > fiveMinFromNow) {
    return { token: conn.access_token, realmId: conn.realm_id, tenantId: conn.tenantId, connId: conn.id };
  }

  // Refresh via backend (keeps client secret secure)
  const session = await getSession();
  const response = await fetch('https://your-backend.com/api/extension/qb/refresh-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connectionId: conn.id,
      refreshToken: conn.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const newTokens = await response.json();

  // Update local cache
  await supabaseRequest(
    `qb_connections?id=eq.${conn.id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken,
        token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000).toISOString(),
      }),
    }
  );

  return { token: newTokens.accessToken, realmId: conn.realm_id, tenantId: conn.tenantId, connId: conn.id };
}
```

---

## 🌍 Environment Variables

Configure these in your backend deployment:

### Production (.env.production)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# QuickBooks
QB_CLIENT_ID=ABc...
QB_CLIENT_SECRET=xxxxxxxx  # NEVER expose to frontend

# Gemini AI
GEMINI_API_KEY=AIzaSy...

# Backend URL (for extension to call)
NEXT_PUBLIC_API_URL=https://kyriq.com
```

### Development (.env.local)
```bash
# Supabase (dev project)
NEXT_PUBLIC_SUPABASE_URL=https://dev-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# QuickBooks (sandbox)
QB_CLIENT_ID=ABc...sandbox...
QB_CLIENT_SECRET=xxxxxxxx

# Gemini AI (dev key)
GEMINI_API_KEY=AIzaSy...dev...

# Backend URL (local)
NEXT_PUBLIC_API_URL=http://localhost:3080
```

---

## 🔒 Security Considerations

### What Gets Exposed to Extension:
✅ **Safe to expose:**
- Supabase URL (public)
- Supabase Anon Key (public, row-level security protects data)
- QB Client ID (public)
- Gemini API Key (rate-limited per user)

❌ **NEVER expose:**
- QB Client Secret (used for token refresh)
- Supabase Service Role Key
- Database passwords
- Private encryption keys

### Rate Limiting

Implement rate limiting on `/api/extension/config`:
```typescript
// Example with rate limiting
import rateLimit from 'express-rate-limit';

const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per window
  message: 'Too many requests, please try again later',
});

export default configLimiter(handler);
```

### API Key Rotation

When rotating API keys:
1. Update environment variables in backend
2. Restart backend server
3. Extension auto-fetches new config on next request
4. **No extension update needed!**

---

## 🧪 Testing Backend Integration

### Test Config Endpoint:
```bash
# Get auth token first
TOKEN="your_session_token"

# Test config endpoint
curl -X GET https://kyriq.com/api/extension/config \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "supabaseUrl": "https://xxxxx.supabase.co",
#   "supabaseAnonKey": "eyJ...",
#   "qbClientId": "ABc...",
#   "geminiApiKey": "AIza..."
# }
```

### Test Token Refresh:
```bash
curl -X POST https://kyriq.com/api/extension/qb/refresh-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "uuid",
    "refreshToken": "refresh_token_here"
  }'
```

---

## 📋 Migration Checklist

To migrate from manual config to backend config:

- [ ] Create `/api/extension/config` endpoint
- [ ] Create `/api/extension/qb/refresh-token` endpoint
- [ ] Update service worker `getConfig()` function
- [ ] Update service worker `getValidQBToken()` function
- [ ] Remove Settings UI from popup (or make it admin-only)
- [ ] Remove Options page (or make it admin-only)
- [ ] Test config fetching with valid session
- [ ] Test config caching (1 hour TTL)
- [ ] Test token refresh flow
- [ ] Update documentation
- [ ] Deploy backend changes
- [ ] Update extension and submit to store

---

## 🎯 Benefits Summary

**For Users:**
- ✅ No manual configuration needed
- ✅ Simpler onboarding (just login)
- ✅ No exposure to sensitive keys

**For Developers:**
- ✅ Centralized credential management
- ✅ Easy key rotation
- ✅ Better security
- ✅ No extension updates for config changes

**For Security:**
- ✅ QB Client Secret never exposed
- ✅ Reduced attack surface
- ✅ Easier compliance (SOC 2, etc.)
- ✅ Audit trail for config access

---

## 📞 Support

For backend integration questions:
- Email: dev@itaxhub.com
- Docs: https://kyriq.com/docs/extension-backend
