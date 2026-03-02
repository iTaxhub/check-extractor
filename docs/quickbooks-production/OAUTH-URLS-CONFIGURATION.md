# QuickBooks OAuth URLs Configuration Guide

## Complete URL Configuration for Intuit Developer Portal

This document provides the exact URLs you need to configure in your Intuit Developer Portal for both Development and Production environments.

---

## 🔧 DEVELOPMENT ENVIRONMENT (Localhost)

Use these URLs during development and testing with sandbox companies.

### Development URLs Table

| Field | URL | Notes |
|-------|-----|-------|
| **Host Domain** | `localhost:3080` | No protocol (http://) |
| **Launch URL** | `http://localhost:3080/settings?tab=integrations` | Where users land after "installing" your app |
| **Connect URL** | `http://localhost:3080/api/qbo/auth` | Initiates OAuth flow |
| **Reconnect URL** | `http://localhost:3080/api/qbo/auth` | Same as Connect URL |
| **Disconnect URL** | `http://localhost:3080/api/qbo/disconnect` | Revokes connection |
| **Redirect URI** | `http://localhost:3080/api/qbo/callback` | OAuth callback endpoint |

### Development Configuration Steps

1. **Go to Intuit Developer Portal**
   - Navigate to: https://developer.intuit.com/app/developer/myapps
   - Click on your app
   - Go to "Keys & OAuth" section

2. **Add Development Redirect URI**
   - Scroll to "Redirect URIs" section
   - Click "Add URI"
   - Enter: `http://localhost:3080/api/qbo/callback`
   - Click "Save"

3. **Configure Development URLs**
   - In the "App Settings" section
   - Add each URL from the table above
   - Ensure exact match (including http://, no trailing slashes)

---

## 🚀 PRODUCTION ENVIRONMENT (Vercel)

Use these URLs for production deployment after Intuit approval.

### Production URLs Table (Vercel)

| Field | URL | Notes |
|-------|-----|-------|
| **Host Domain** | `check-extractor-frontend.vercel.app` | No protocol (https://) |
| **Launch URL** | `https://check-extractor-frontend.vercel.app/settings?tab=integrations` | HTTPS required |
| **Connect URL** | `https://check-extractor-frontend.vercel.app/api/qbo/auth` | HTTPS required |
| **Reconnect URL** | `https://check-extractor-frontend.vercel.app/api/qbo/auth` | Same as Connect URL |
| **Disconnect URL** | `https://check-extractor-frontend.vercel.app/api/qbo/disconnect` | HTTPS required |
| **Redirect URI** | `https://check-extractor-frontend.vercel.app/api/qbo/callback` | HTTPS required |

### Production Configuration Steps

1. **Deploy to Vercel First**
   - Ensure your app is deployed and accessible
   - Verify HTTPS is working
   - Test all endpoints manually

2. **Add Production Redirect URI**
   - In Intuit Developer Portal → Keys & OAuth
   - Click "Add URI" in Redirect URIs section
   - Enter: `https://check-extractor-frontend.vercel.app/api/qbo/callback`
   - Click "Save"

3. **Update Production URLs**
   - Replace all localhost URLs with production URLs
   - Verify HTTPS protocol on all URLs
   - Remove any trailing slashes

4. **Test OAuth Flow**
   - Initiate connection from production app
   - Verify redirect to Intuit works
   - Verify callback returns to your app
   - Confirm tokens are stored correctly

---

## 📋 URL REQUIREMENTS AND RULES

### Critical Requirements

✅ **MUST DO:**
- Use HTTPS for all production URLs (HTTP only allowed for localhost)
- Match URLs EXACTLY (case-sensitive, no extra spaces)
- Include query parameters if needed (e.g., `?tab=integrations`)
- Use the same domain across all URLs
- Test each URL before submission

❌ **DO NOT:**
- Add trailing slashes (e.g., `/callback/` is wrong, `/callback` is correct)
- Mix HTTP and HTTPS in production
- Use IP addresses instead of domain names
- Include authentication tokens in URLs
- Use different domains for different URLs

### URL Format Rules

**Host Domain:**
- Format: `domain.com` or `subdomain.domain.com`
- NO protocol (no `http://` or `https://`)
- NO port numbers in production
- NO paths or query parameters

**All Other URLs:**
- Format: `https://domain.com/path`
- MUST include protocol (`https://` for production, `http://` for localhost)
- MUST include full path
- CAN include query parameters
- NO trailing slashes

---

## 🔄 MULTIPLE ENVIRONMENTS

You can configure BOTH development and production URLs simultaneously.

### Recommended Setup

**During Development:**
```
Redirect URIs:
1. http://localhost:3080/api/qbo/callback
2. https://check-extractor-frontend.vercel.app/api/qbo/callback

Active URLs: localhost (for testing)
```

**After Production Approval:**
```
Redirect URIs:
1. http://localhost:3080/api/qbo/callback (keep for future dev)
2. https://check-extractor-frontend.vercel.app/api/qbo/callback (active)

Active URLs: Production Vercel URLs
```

---

## 🧪 TESTING YOUR URLS

### Pre-Submission Checklist

Before submitting for production, test each URL:

**1. Launch URL Test**
```bash
# Should load your settings/integrations page
curl -I https://check-extractor-frontend.vercel.app/settings?tab=integrations
# Expected: 200 OK
```

**2. Connect URL Test**
```bash
# Should return JSON with authUrl
curl https://check-extractor-frontend.vercel.app/api/qbo/auth
# Expected: {"authUrl": "https://appcenter.intuit.com/connect/oauth2?..."}
```

**3. Disconnect URL Test**
```bash
# Should accept POST request
curl -X POST https://check-extractor-frontend.vercel.app/api/qbo/disconnect
# Expected: Success response or 401 if not authenticated
```

**4. Callback URL Test**
```bash
# Should accept GET with query parameters
curl "https://check-extractor-frontend.vercel.app/api/qbo/callback?code=test&state=test&realmId=123"
# Expected: Redirect to settings page
```

### Manual OAuth Flow Test

1. **Initiate Connection**
   - Go to: `https://check-extractor-frontend.vercel.app/settings?tab=integrations`
   - Click "Connect to QuickBooks"
   - Should redirect to Intuit OAuth page

2. **Authorize**
   - Log in with your Intuit Developer account
   - Select sandbox company
   - Click "Authorize"

3. **Verify Callback**
   - Should redirect back to: `https://check-extractor-frontend.vercel.app/settings?tab=integrations&success=quickbooks_connected`
   - Connection status should show "Connected"
   - Tokens should be stored in database

4. **Test Disconnect**
   - Click "Disconnect"
   - Should revoke tokens
   - Connection status should show "Not connected"

---

## 🔐 SECURITY CONSIDERATIONS

### HTTPS Requirements

**Production:**
- ALL URLs MUST use HTTPS
- Valid SSL/TLS certificate required
- Vercel provides this automatically

**Development:**
- HTTP allowed for localhost only
- HTTPS recommended even for localhost (optional)

### Redirect URI Security

**State Parameter:**
- Always use state parameter for CSRF protection
- Verify state in callback
- Generate random, unique state for each request

**Code Verification:**
- Validate authorization code in callback
- Exchange code for tokens immediately
- Never expose tokens in URLs or logs

---

## 🌐 CUSTOM DOMAIN SETUP (Optional)

If you want to use a custom domain instead of Vercel's default:

### Custom Domain URLs

| Field | URL (Example) |
|-------|---------------|
| **Host Domain** | `app.chequeextractor.com` |
| **Launch URL** | `https://app.chequeextractor.com/settings?tab=integrations` |
| **Connect URL** | `https://app.chequeextractor.com/api/qbo/auth` |
| **Reconnect URL** | `https://app.chequeextractor.com/api/qbo/auth` |
| **Disconnect URL** | `https://app.chequeextractor.com/api/qbo/disconnect` |
| **Redirect URI** | `https://app.chequeextractor.com/api/qbo/callback` |

### Custom Domain Setup Steps

1. **Add Domain to Vercel**
   - Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **Wait for SSL Certificate**
   - Vercel automatically provisions SSL certificate
   - Usually takes 5-10 minutes
   - Verify HTTPS works before proceeding

3. **Update Intuit URLs**
   - Replace Vercel URLs with custom domain URLs
   - Add new redirect URI
   - Test OAuth flow with new domain

4. **Update Environment Variables**
   - Update `NEXT_PUBLIC_APP_URL` to custom domain
   - Update `QUICKBOOKS_REDIRECT_URI` if stored in env
   - Redeploy application

---

## 📝 INTUIT PORTAL CONFIGURATION SCREENSHOTS

### Where to Find URL Settings

**1. Keys & OAuth Tab**
```
Developer Portal → Your App → Keys & OAuth

Section: Redirect URIs
- Add both development and production URIs here
- Click "Add URI" button
- Enter full URL including protocol
- Click "Save"
```

**2. App Settings Tab**
```
Developer Portal → Your App → Settings

Section: App URLs
- Host Domain
- Launch URL
- Connect URL
- Reconnect URL
- Disconnect URL
```

---

## ⚠️ COMMON ERRORS AND SOLUTIONS

### Error: "Redirect URI Mismatch"

**Cause:** URL in your app doesn't match Intuit configuration

**Solution:**
1. Check exact URL in Intuit portal (including protocol, domain, path)
2. Verify no trailing slashes
3. Check for typos or extra spaces
4. Ensure protocol matches (http vs https)

### Error: "Invalid Host Domain"

**Cause:** Host domain includes protocol or path

**Solution:**
- ❌ Wrong: `https://check-extractor-frontend.vercel.app`
- ✅ Correct: `check-extractor-frontend.vercel.app`

### Error: "Connection Failed"

**Cause:** URLs not accessible or returning errors

**Solution:**
1. Test each URL manually in browser
2. Check application is deployed and running
3. Verify no firewall or security blocking
4. Check server logs for errors

### Error: "Callback Not Working"

**Cause:** Callback URL not handling OAuth response correctly

**Solution:**
1. Verify callback endpoint exists: `/api/qbo/callback`
2. Check it accepts GET requests with query parameters
3. Verify state parameter validation
4. Check token exchange logic
5. Review server logs for errors

---

## 📞 SUPPORT

If you encounter issues with URL configuration:

1. **Intuit Developer Support**
   - Forum: https://help.developer.intuit.com/s/
   - Documentation: https://developer.intuit.com/app/developer/qbo/docs

2. **Verify URLs Match**
   - Use this document as reference
   - Double-check every character
   - Test in browser before submitting

3. **Common Issues**
   - Most problems are typos or trailing slashes
   - HTTPS vs HTTP mismatch
   - Wrong domain or path

---

## ✅ FINAL VERIFICATION CHECKLIST

Before submitting for production review:

- [ ] All production URLs use HTTPS
- [ ] No trailing slashes on any URLs
- [ ] Host domain has no protocol
- [ ] Redirect URI added to Intuit portal
- [ ] All URLs tested and working
- [ ] OAuth flow tested end-to-end
- [ ] Tokens stored securely
- [ ] Disconnect functionality works
- [ ] URLs match exactly in code and Intuit portal
- [ ] Custom domain SSL certificate active (if using custom domain)

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Status:** Ready for Production Configuration
