# QuickBooks Production Deployment Guide

## Complete Step-by-Step Deployment Process

This guide walks you through deploying your application to production and submitting it for QuickBooks production approval.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before deploying to production, ensure:

- [ ] All legal pages created (Privacy Policy, Terms, EULA)
- [ ] OAuth flow tested in development
- [ ] QuickBooks sandbox connection working
- [ ] OCR processing functional
- [ ] Database migrations completed
- [ ] Environment variables documented
- [ ] All features tested locally
- [ ] Code committed to Git repository

---

## 🚀 STEP 1: DEPLOY FRONTEND TO VERCEL

### 1.1 Prepare Repository

```bash
# Ensure you're in the frontend directory
cd frontend

# Commit all changes
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 1.2 Deploy to Vercel

**Option A: Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Note the deployment URL (e.g., check-extractor-frontend.vercel.app)
```

**Option B: Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Click "Deploy"

### 1.3 Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# QuickBooks (Production Credentials)
QUICKBOOKS_CLIENT_ID=your-production-client-id
QUICKBOOKS_CLIENT_SECRET=your-production-client-secret
QUICKBOOKS_REDIRECT_URI=https://check-extractor-frontend.vercel.app/api/qbo/callback

# App URL
NEXT_PUBLIC_APP_URL=https://check-extractor-frontend.vercel.app

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### 1.4 Verify Deployment

```bash
# Test homepage
curl -I https://check-extractor-frontend.vercel.app

# Test legal pages
curl -I https://check-extractor-frontend.vercel.app/legal/privacy
curl -I https://check-extractor-frontend.vercel.app/legal/terms
curl -I https://check-extractor-frontend.vercel.app/legal/eula

# Test API endpoints
curl https://check-extractor-frontend.vercel.app/api/qbo/auth
```

---

## 🐳 STEP 2: DEPLOY BACKEND TO RAILWAY

### 2.1 Prepare Backend

```bash
# Navigate to backend directory
cd backend

# Ensure requirements.txt is up to date
pip freeze > requirements.txt

# Commit changes
git add .
git commit -m "Prepare backend for production"
git push origin main
```

### 2.2 Deploy to Railway

**Using Railway CLI:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up

# Note the deployment URL
```

**Using Railway Dashboard:**

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Configure:
   - Root Directory: `backend`
   - Start Command: `uvicorn api_server:app --host 0.0.0.0 --port $PORT`

### 2.3 Configure Environment Variables

In Railway Dashboard → Your Service → Variables:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# QuickBooks
INTUIT_CLIENT_ID=your-production-client-id
INTUIT_CLIENT_SECRET=your-production-client-secret
INTUIT_REDIRECT_URI=https://check-extractor-frontend.vercel.app/api/qbo/callback

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Python
PYTHONUNBUFFERED=1
```

### 2.4 Verify Backend

```bash
# Test health endpoint
curl https://your-backend.railway.app/health

# Test API
curl https://your-backend.railway.app/api/status
```

---

## 🗄️ STEP 3: CONFIGURE SUPABASE

### 3.1 Production Database Setup

1. **Go to Supabase Dashboard**
   - https://app.supabase.com

2. **Create Production Project** (if not already created)
   - Click "New Project"
   - Choose organization
   - Enter project name
   - Set strong database password
   - Select region (closest to your users)

3. **Run Migrations**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 3.2 Configure Row-Level Security

Ensure RLS is enabled on all tables:

```sql
-- Enable RLS on integrations table
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can access own integrations"
ON integrations
FOR ALL
USING (auth.uid() = user_id);

-- Repeat for other tables (qb_entries, documents, etc.)
```

### 3.3 Configure Storage

1. **Create Storage Buckets**
   - Bucket name: `cheque-images`
   - Public: No
   - File size limit: 10MB

2. **Set Storage Policies**

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload own cheques"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cheque-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read own files
CREATE POLICY "Users can read own cheques"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'cheque-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3.4 Get Production Credentials

```bash
# From Supabase Dashboard → Settings → API

# Copy these values:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 🔐 STEP 4: CONFIGURE QUICKBOOKS PRODUCTION CREDENTIALS

### 4.1 Get Production Keys

1. **Go to Intuit Developer Portal**
   - https://developer.intuit.com/app/developer/myapps

2. **Select Your App**
   - Click on your app name

3. **Go to Keys & OAuth Tab**
   - Switch to "Production" keys (toggle at top)
   - Copy Production Client ID
   - Copy Production Client Secret

### 4.2 Add Production Redirect URIs

1. **In Keys & OAuth Tab**
   - Scroll to "Redirect URIs" section
   - Click "Add URI"
   - Enter: `https://check-extractor-frontend.vercel.app/api/qbo/callback`
   - Click "Save"

2. **Configure App URLs**
   - Go to "Settings" tab
   - Add production URLs (see OAUTH-URLS-CONFIGURATION.md)

### 4.3 Update Environment Variables

Update Vercel and Railway with production QuickBooks credentials:

```env
QUICKBOOKS_CLIENT_ID=your-production-client-id
QUICKBOOKS_CLIENT_SECRET=your-production-client-secret
QUICKBOOKS_REDIRECT_URI=https://check-extractor-frontend.vercel.app/api/qbo/callback
```

---

## ✅ STEP 5: VERIFY PRODUCTION DEPLOYMENT

### 5.1 Test Legal Pages

Visit each page and verify they load without errors:

- https://check-extractor-frontend.vercel.app/legal/privacy
- https://check-extractor-frontend.vercel.app/legal/terms
- https://check-extractor-frontend.vercel.app/legal/eula

**Checklist:**
- [ ] Pages load without authentication
- [ ] Content is complete and formatted correctly
- [ ] No broken links
- [ ] Mobile responsive
- [ ] No console errors

### 5.2 Test OAuth Flow (Development Mode)

1. **Initiate Connection**
   - Go to: https://check-extractor-frontend.vercel.app/settings?tab=integrations
   - Click "Connect to QuickBooks"

2. **Authorize**
   - Should redirect to Intuit OAuth page
   - Log in with Intuit Developer account
   - Select sandbox company
   - Click "Authorize"

3. **Verify Callback**
   - Should redirect back to settings page
   - Connection status should show "Connected"
   - Check database for stored tokens

4. **Test Functionality**
   - Upload a test cheque
   - Verify OCR extraction works
   - Test QuickBooks sync (if applicable)

### 5.3 Test All Features

- [ ] User registration/login
- [ ] Cheque upload
- [ ] OCR processing
- [ ] Data extraction display
- [ ] QuickBooks connection
- [ ] Data sync to QuickBooks
- [ ] Reconciliation view
- [ ] Settings management
- [ ] Account deletion

### 5.4 Performance Testing

```bash
# Test page load times
curl -w "@curl-format.txt" -o /dev/null -s https://check-extractor-frontend.vercel.app

# Test API response times
time curl https://check-extractor-frontend.vercel.app/api/qbo/auth
```

### 5.5 Security Verification

- [ ] All pages use HTTPS
- [ ] SSL certificate valid
- [ ] No mixed content warnings
- [ ] Security headers present
- [ ] No sensitive data in client-side code
- [ ] OAuth tokens encrypted in database

---

## 📝 STEP 6: CREATE DEMO ACCOUNT

### 6.1 Set Up Demo Account

1. **Create Demo User**
   ```
   Email: demo@chequeextractor.com
   Password: [Strong password for Intuit reviewers]
   ```

2. **Pre-load Sample Data**
   - Upload 3-5 sample cheque images
   - Process them through OCR
   - Leave some in various states (pending, processed, synced)

3. **Connect QuickBooks Sandbox**
   - Connect demo account to sandbox company
   - Sync some sample data
   - Show reconciliation features

### 6.2 Document Demo Flow

Create a document for Intuit reviewers:

```markdown
# Demo Account Instructions

**Login Credentials:**
- Email: demo@chequeextractor.com
- Password: [provided separately]

**Demo Flow:**
1. Log in with credentials above
2. Go to Dashboard - see sample processed cheques
3. Click "Upload" to upload a new cheque (sample images provided)
4. View OCR extraction results
5. Go to Settings → Integrations - QuickBooks already connected
6. Go to QB Comparisons - see reconciliation features
7. Test sync functionality (optional)

**Sample Cheque Images:**
Provided in email attachment or available at: [URL]

**QuickBooks Sandbox:**
Already connected - no action needed

**Expected Behavior:**
- OCR extraction shows confidence scores
- Users can edit extracted data
- Duplicate detection works
- Sync to QuickBooks creates entries
```

---

## 📤 STEP 7: SUBMIT FOR PRODUCTION REVIEW

### 7.1 Pre-Submission Checklist

Use the MASTER-CHECKLIST.md to verify everything is ready:

- [ ] All legal pages deployed and accessible
- [ ] OAuth URLs configured correctly
- [ ] Production credentials working
- [ ] Demo account created and tested
- [ ] All features functional
- [ ] Security measures in place
- [ ] Compliance statements prepared

### 7.2 Submit Application

1. **Go to Intuit Developer Portal**
   - https://developer.intuit.com/app/developer/myapps
   - Click your app
   - Click "Submit for Production" button

2. **Fill Out Production Review Form**

**App Information:**
- App Name: Cheque Extractor
- Short Description: (see APP-DESCRIPTIONS.md)
- Full Description: (see APP-DESCRIPTIONS.md)
- Category: Accounting Automation

**Legal Pages:**
- Privacy Policy URL: `https://check-extractor-frontend.vercel.app/legal/privacy`
- Terms of Service URL: `https://check-extractor-frontend.vercel.app/legal/terms`
- EULA URL: `https://check-extractor-frontend.vercel.app/legal/eula`

**OAuth URLs:**
- (Copy from OAUTH-URLS-CONFIGURATION.md)

**Compliance:**
- (Copy statements from COMPLIANCE-STATEMENTS.md)

**Demo Account:**
- Email: demo@chequeextractor.com
- Password: [provided in secure field]
- Instructions: [paste demo flow document]

3. **Upload Screenshots**
   - Dashboard view
   - OCR extraction results
   - QuickBooks connection screen
   - Reconciliation view
   - Settings page

4. **Submit**
   - Review all information
   - Click "Submit for Review"
   - Note submission date and reference number

---

## ⏱️ STEP 8: DURING REVIEW PERIOD

### 8.1 Monitor Email

- Check email daily for Intuit communications
- Respond promptly to any questions (within 24 hours)
- Be prepared to make changes if requested

### 8.2 Keep Demo Account Active

- Ensure demo account remains accessible
- Keep sample data available
- Monitor for any issues

### 8.3 Don't Make Major Changes

- Avoid deploying major updates during review
- Bug fixes are okay
- Document any changes made

### 8.4 Expected Timeline

- **Initial Review:** 2-3 business days
- **Follow-up Questions:** 1-2 days (if any)
- **Final Approval:** 1 day after all requirements met
- **Total:** 3-7 business days typically

---

## ✅ STEP 9: AFTER APPROVAL

### 9.1 Production Keys Activated

1. **Verify Production Keys Work**
   - Test OAuth flow with production keys
   - Verify can connect to real QuickBooks accounts
   - Test with your own QuickBooks account first

2. **Update Documentation**
   - Update README with production status
   - Document any production-specific setup
   - Update user guides

### 9.2 Monitor Production

1. **Set Up Monitoring**
   - Error tracking (Sentry, LogRocket, etc.)
   - Performance monitoring
   - Uptime monitoring

2. **Monitor Metrics**
   - User signups
   - QuickBooks connections
   - OCR processing volume
   - Error rates

3. **User Support**
   - Set up support email
   - Create help documentation
   - Prepare for user questions

### 9.3 Marketing and Launch

1. **Announce Launch**
   - Email existing users (if any)
   - Social media announcement
   - Update website

2. **User Onboarding**
   - Create onboarding flow
   - Welcome emails
   - Tutorial videos

---

## 🚨 TROUBLESHOOTING

### Common Deployment Issues

**Issue: Vercel Build Fails**
```bash
# Check build logs in Vercel dashboard
# Common fixes:
- Verify all dependencies in package.json
- Check for TypeScript errors
- Ensure environment variables are set
```

**Issue: Railway Deployment Fails**
```bash
# Check deployment logs
# Common fixes:
- Verify requirements.txt is complete
- Check Python version compatibility
- Ensure start command is correct
```

**Issue: Database Connection Fails**
```bash
# Verify Supabase credentials
# Check:
- SUPABASE_URL is correct
- SUPABASE_KEY has correct permissions
- Database is not paused (free tier)
```

**Issue: OAuth Not Working**
```bash
# Verify:
- Redirect URI matches exactly
- Production keys are being used
- URLs use HTTPS
- No trailing slashes
```

---

## 📞 SUPPORT RESOURCES

**Vercel:**
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support

**Railway:**
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway

**Supabase:**
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com

**Intuit:**
- Developer Portal: https://developer.intuit.com
- Support Forum: https://help.developer.intuit.com/s/

---

## ✅ FINAL DEPLOYMENT CHECKLIST

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Supabase production database configured
- [ ] All environment variables set
- [ ] Legal pages accessible
- [ ] OAuth URLs configured
- [ ] Production QuickBooks credentials added
- [ ] Demo account created and tested
- [ ] All features tested in production
- [ ] Security verified
- [ ] Monitoring set up
- [ ] Submitted for Intuit review
- [ ] Documentation updated

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Status:** Production Deployment Ready
