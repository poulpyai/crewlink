# CrewLink - Production Deployment Guide
**Domain:** crewlink.live  
**Email:** support@crewlink.live  
**Target:** Production Launch (Clean Database)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ **Completed:**
- [x] Domain purchased: `crewlink.live`
- [x] Email created: `support@crewlink.live`
- [x] Platform tested (9+ hours)
- [x] All booking flows verified
- [x] Mobile responsive tested
- [x] Code cleaned (debug logs removed)

### ⏳ **To Complete:**
- [ ] Prepare code for production
- [ ] Create GitHub repository
- [ ] Set up production Supabase
- [ ] Deploy to Vercel
- [ ] Configure domain DNS
- [ ] Update environment variables
- [ ] Test production deployment

---

## 🛠️ STEP 1: PREPARE CODE FOR PRODUCTION

### 1.1 Update Environment Variables Template

Create `.env.example` for documentation:

```bash
cd /Users/quentindelarre/.openclaw/workspace/projects/crewlink

cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://crewlink.live
EOF
```

### 1.2 Verify .gitignore

Check that sensitive files are ignored:

```bash
# Should already be in .gitignore:
.env.local
.env
.env*.local
node_modules/
.next/
```

### 1.3 Remove Test Credentials (If Any)

Search for any hardcoded credentials:

```bash
# Search for potential exposed credentials
grep -r "qazwsxedc" . --exclude-dir={node_modules,.next} || echo "✅ No test passwords found"
grep -r "eyJhbGc" . --exclude-dir={node_modules,.next} --exclude=".env*" || echo "✅ No exposed tokens"
```

### 1.4 Update Site Metadata

Update `app/layout.tsx` with production domain:

```typescript
// Find and update:
export const metadata: Metadata = {
  title: 'CrewLink - Aviation Training Marketplace',
  description: 'Connect with flight simulators, examiners, and AMEs worldwide',
  metadataBase: new URL('https://crewlink.live'), // ← UPDATE THIS
}
```

---

## 📦 STEP 2: CREATE GITHUB REPOSITORY

### 2.1 Initialize Git (if not already)

```bash
cd /Users/quentindelarre/.openclaw/workspace/projects/crewlink

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - CrewLink MVP

- Complete booking system (AME, Examiner, Simulator)
- Mobile responsive design
- Messaging system
- Authentication with Supabase
- Clean, production-ready code"
```

### 2.2 Create GitHub Repository

**Option A: Via GitHub CLI (if installed):**

```bash
gh repo create crewlink --public --source=. --remote=origin --push
```

**Option B: Manual (if no GitHub CLI):**

1. Go to https://github.com/new
2. Repository name: `crewlink`
3. Description: "Aviation training marketplace - Connect pilots with simulators, examiners, and AMEs"
4. Public or Private: **Private** (for now)
5. Don't initialize with README (you have code already)
6. Click "Create repository"

### 2.3 Push Code to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/crewlink.git

# Push code
git branch -M main
git push -u origin main
```

---

## 🗄️ STEP 3: CREATE PRODUCTION SUPABASE PROJECT

### 3.1 Create New Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. **Project Name:** CrewLink Production
4. **Database Password:** Save this securely (you'll need it)
5. **Region:** Choose closest to your users (Singapore for you)
6. Click "Create new project"
7. **Wait 2-3 minutes** for provisioning

### 3.2 Save Project Credentials

Once created, go to **Settings → API**:

```
Project URL: https://[YOUR_PROJECT_REF].supabase.co
anon/public key: eyJhbGc... (starts with eyJ)
service_role key: eyJhbGc... (starts with eyJ, KEEP SECRET)
```

**Save these in a secure location!** (Password manager, encrypted note)

### 3.3 Run Database Migrations

**Copy migration files to production:**

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Run each migration file in order:

**Migration 001: Core Schema** (from your dev database)
```sql
-- Run your original schema setup
-- You'll need to export this from your dev Supabase
-- Go to: Database → Schema Visualizer → Export SQL
```

**Easiest approach:** Copy all tables from dev to production:

1. Dev Supabase → Database → Schema Visualizer → Export SQL
2. Copy the entire SQL output
3. Prod Supabase → SQL Editor → Paste → Run

**OR manually create tables** (from your existing migrations if you have them saved)

### 3.4 Set Up RLS Policies

Make sure all RLS policies are applied (these were fixed during testing):

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE examiner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Copy all RLS policies from dev
-- (Use the export from Step 3.3 - policies are included)
```

### 3.5 Configure Auth Settings

**Settings → Authentication:**

1. **Site URL:** `https://crewlink.live`
2. **Redirect URLs:** Add:
   - `https://crewlink.live/**`
   - `http://localhost:3000/**` (for local testing)
3. **Email Templates:** Customize later (optional)
4. **Auth Providers:** Email enabled (default)

---

## 🚀 STEP 4: DEPLOY TO VERCEL

### 4.1 Sign Up / Log In

1. Go to https://vercel.com
2. Sign up with GitHub account (easiest)
3. Authorize Vercel to access your repositories

### 4.2 Import Project

1. Click "Add New..." → "Project"
2. Import Git Repository
3. Select your `crewlink` repo
4. Click "Import"

### 4.3 Configure Build Settings

**Vercel should auto-detect Next.js. Verify:**

- **Framework Preset:** Next.js
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)

### 4.4 Add Environment Variables

Click "Environment Variables" and add:

```
NEXT_PUBLIC_SUPABASE_URL = https://[YOUR_PROD_PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc... (your prod anon key)
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc... (your prod service_role key)
NEXT_PUBLIC_SITE_URL = https://crewlink.live
```

**Important:** 
- All environments: Production, Preview, Development ✅
- Triple-check no extra spaces in values
- Service role key stays SECRET (never expose client-side)

### 4.5 Deploy!

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. You'll get a temporary URL: `https://crewlink-xxx.vercel.app`
4. **Test this URL first** before connecting domain

---

## 🌐 STEP 5: CONNECT DOMAIN TO VERCEL

### 5.1 Add Domain in Vercel

1. Go to your project → Settings → Domains
2. Click "Add"
3. Enter: `crewlink.live`
4. Click "Add"

Vercel will show DNS records to configure.

### 5.2 Update DNS Settings

**Go to your domain registrar** (where you bought crewlink.live):

**If you want Vercel to manage everything:**

1. Set nameservers to Vercel (Vercel will give you these)
2. Simplest option, recommended

**OR configure DNS manually:**

Add these records:

```
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP)

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

**Note:** DNS propagation takes 10 minutes to 24 hours (usually ~10 minutes).

### 5.3 Verify Domain

1. Wait 5-10 minutes
2. In Vercel → Domains, check status
3. Should show "Valid Configuration" with a green checkmark
4. Visit https://crewlink.live to test!

---

## ✅ STEP 6: POST-DEPLOYMENT TESTING

### 6.1 Production Smoke Test

Visit https://crewlink.live and test:

**Basic Functionality:**
- [ ] Homepage loads
- [ ] Sign up form works
- [ ] Create new pilot account
- [ ] Log in with new account
- [ ] Browse simulators page loads
- [ ] Browse examiners page loads
- [ ] Browse medical page loads
- [ ] Dashboard accessible

**Booking Flow (Critical):**
- [ ] Create a test AME account
- [ ] Create an AME slot
- [ ] Book the slot as pilot
- [ ] Confirm booking as AME
- [ ] Verify slot shows "Booked"
- [ ] Check messaging works

**Mobile Test:**
- [ ] Test on your phone
- [ ] Verify responsive layout
- [ ] Try booking on mobile

### 6.2 Check Console for Errors

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - ❌ Red errors (fix immediately)
   - ⚠️ Warnings (note for later)
   - ✅ No errors = great!

### 6.3 Verify Email Delivery

Test Supabase auth emails:
- [ ] Sign up flow sends confirmation email
- [ ] Password reset works
- [ ] Emails not going to spam

---

## 🔧 STEP 7: PRODUCTION CONFIGURATION

### 7.1 Add Google Analytics (Optional)

In `app/layout.tsx`, add:

```typescript
// Add to <head>
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

### 7.2 Set Up Error Tracking (Recommended)

**Option A: Sentry (Popular)**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Option B: Skip for now**, monitor Vercel logs manually

### 7.3 Configure Contact Email

Update any contact forms to send to `support@crewlink.live`

---

## 📊 STEP 8: MONITORING & MAINTENANCE

### 8.1 Vercel Dashboard

Monitor:
- **Analytics:** Page views, visitors
- **Logs:** Runtime errors
- **Speed Insights:** Performance metrics

### 8.2 Supabase Dashboard

Monitor:
- **Database:** Table sizes, queries
- **Auth:** User signups
- **API:** Request volume
- **Logs:** Errors, slow queries

### 8.3 Regular Backups

**Supabase backups:**
1. Database → Backups (automatic)
2. Export SQL dumps weekly (manual safety)

---

## 🚨 TROUBLESHOOTING

### Issue: "Invalid API Key" errors

**Fix:** 
- Check environment variables in Vercel
- Verify no extra spaces
- Confirm using PRODUCTION Supabase keys

### Issue: Auth redirects to localhost

**Fix:**
- Update Supabase Site URL to `https://crewlink.live`
- Clear browser cache
- Re-test signup flow

### Issue: DNS not resolving

**Fix:**
- Wait 10-30 minutes for propagation
- Use https://dnschecker.org to verify
- Check DNS records are correct

### Issue: Build fails on Vercel

**Fix:**
- Check Vercel deployment logs
- Verify all dependencies in package.json
- Test `npm run build` locally first

### Issue: Database connection fails

**Fix:**
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check Supabase project is not paused
- Confirm RLS policies allow public access where needed

---

## 🎯 PRODUCTION CHECKLIST

Before announcing launch:

### Security
- [ ] Environment variables secured
- [ ] RLS policies active on all tables
- [ ] Service role key never exposed client-side
- [ ] HTTPS enabled (Vercel handles this)

### Functionality  
- [ ] All 3 booking flows tested
- [ ] Messaging works
- [ ] Email confirmations send
- [ ] Mobile responsive verified

### Content
- [ ] About/FAQ pages exist (if needed)
- [ ] Terms of Service page (create later)
- [ ] Privacy Policy page (create later)
- [ ] Contact support email works

### Marketing
- [ ] Beta user list ready (5-10 pilots + providers)
- [ ] Launch announcement drafted
- [ ] Social media accounts created (optional)

---

## 📈 BETA LAUNCH PLAN

### Week 1: Soft Launch
**Target:** 5-10 beta users

**Invite:**
- 3-5 pilot friends you trust
- 2-3 AMEs/examiners/sim companies
- Ask for honest feedback

**Monitor:**
- User signups
- Booking completion rate
- Error logs
- User feedback

**Goal:** Verify everything works with real users

### Week 2-3: Feedback & Iteration
- Fix any bugs found
- Improve UX based on feedback
- Add missing features if critical

### Week 4: Public Launch
- Open signups to everyone
- Announce on social media
- Reach out to aviation communities
- Start marketing efforts

---

## 🎉 YOU'RE READY TO LAUNCH!

### Quick Command Reference

**Local Development:**
```bash
cd /Users/quentindelarre/.openclaw/workspace/projects/crewlink
npm run dev
```

**Deploy Updates:**
```bash
git add .
git commit -m "Description of changes"
git push origin main
# Vercel auto-deploys!
```

**View Logs:**
- Vercel: https://vercel.com/[username]/crewlink/logs
- Supabase: https://supabase.com/dashboard/project/[ref]/logs

---

## 📞 SUPPORT RESOURCES

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Your Support Email:** support@crewlink.live

---

**Created:** 2026-03-05  
**Last Updated:** 2026-03-05  
**Status:** Ready for deployment 🚀

**Good luck with the launch, Q!** 🐙
