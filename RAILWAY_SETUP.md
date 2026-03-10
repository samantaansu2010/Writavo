# 🚀 Writavo — Railway Deployment Guide

## What Was Fixed in This Release

| # | Bug | File Fixed |
|---|-----|-----------|
| 1 | MongoDB URI was truncated (ended with `majorit` instead of `majority`) | `backend/.env` |
| 2 | `railway.toml` was in `backend/` — Railway only reads it from project root | `railway.toml` (moved to root) |
| 3 | `FRONTEND_URL` and `GOOGLE_CALLBACK_URL` pointed to `localhost` | `backend/.env` |
| 4 | `JWT_EXPIRES_IN` → must be `JWT_EXPIRATION` to match `environment.js` | `backend/.env` |
| 5 | `RATE_LIMIT_MAX` → must be `RATE_LIMIT_MAX_REQUESTS` to match `environment.js` | `backend/.env` |
| 6 | `.gitignore` did not properly exclude `backend/.env` | `.gitignore` |
| 7 | `node_modules/` was included in the zip/repo | Removed from this release |

---

## Step-by-Step: Deploy to Railway

### Step 1 — Push to GitHub
```bash
git add .
git commit -m "fix: all Railway deployment issues"
git push origin main
```

### Step 2 — Create Railway Service
1. Go to https://railway.app → New Project → Deploy from GitHub Repo
2. Select your `writavo-platform` repo
3. Railway will auto-detect `railway.toml` at the root ✅

### Step 3 — Set Environment Variables in Railway Dashboard
Go to: Railway → your service → **Variables** tab → add ALL of these:

```
MONGODB_URI        = mongodb+srv://samantaansu1892010_db_user:YOUR_PASS@cluster0.mgj9sna.mongodb.net/writavo?retryWrites=true&w=majority
NODE_ENV           = production
JWT_SECRET         = (your secret from .env)
JWT_REFRESH_SECRET = (your refresh secret from .env)
JWT_EXPIRATION     = 7d
JWT_REFRESH_EXPIRATION = 30d
ENABLE_GOOGLE_AUTH = true
GOOGLE_CLIENT_ID   = (from Google Cloud Console)
GOOGLE_CLIENT_SECRET = (from Google Cloud Console)
GOOGLE_CALLBACK_URL = https://YOUR_RAILWAY_URL/api/auth/google/callback
FRONTEND_URL       = https://YOUR_RAILWAY_URL
CORS_ORIGIN        = *
ENABLE_EMAIL_VERIFICATION = true
EMAIL_SERVICE      = gmail
EMAIL_USER         = samantaansu2010@gmail.com
EMAIL_PASSWORD     = (your Gmail App Password)
EMAIL_FROM_NAME    = Writavo
EMAIL_FROM_EMAIL   = samantaansu2010@gmail.com
RATE_LIMIT_MAX_REQUESTS = 100
RATE_LIMIT_WINDOW_MS    = 900000
MAX_FILE_SIZE      = 10485760
UPLOAD_DIR         = ./uploads
```

> ⚠️ Railway does NOT read your local `.env` file. You must add every variable manually in the dashboard.

### Step 4 — Get Your Railway URL
After first deploy, Railway assigns you a URL like:
`https://writavo-production.up.railway.app`

Then update these two variables in the Railway dashboard:
- `FRONTEND_URL` = `https://writavo-production.up.railway.app`
- `GOOGLE_CALLBACK_URL` = `https://writavo-production.up.railway.app/api/auth/google/callback`

### Step 5 — Update Google Cloud Console
1. Go to https://console.cloud.google.com → APIs & Services → Credentials
2. Click your OAuth 2.0 Client
3. Under **Authorized redirect URIs**, add:
   `https://YOUR_RAILWAY_URL/api/auth/google/callback`
4. Save

### Step 6 — Update MongoDB Atlas Network Access
1. Go to https://cloud.mongodb.com → Network Access
2. Click **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
   - Railway uses dynamic IPs so you must allow all
3. Confirm

### Step 7 — Verify Deployment
Visit: `https://YOUR_RAILWAY_URL/api/health`

You should see:
```json
{
  "status": "success",
  "message": "🚀 Writavo API is running",
  "version": "2.0.0"
}
```

---

## ⚠️ Security Reminders

- Your old `.env` was committed to Git — **rotate these credentials immediately**:
  - MongoDB password → change at cloud.mongodb.com
  - JWT secrets → generate new ones with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
  - Google OAuth secret → regenerate at console.cloud.google.com
  - Gmail App Password → revoke and create a new one at myaccount.google.com
- Never commit `.env` again — it's now properly in `.gitignore`
