# Writavo — Setup & Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & Install
```bash
cd backend
npm install
```

### 2. Configure Environment
Edit `backend/.env` — replace `YOUR_RAILWAY_APP_URL` with your actual URL:
```
FRONTEND_URL=http://localhost:5000
APP_URL=http://localhost:5000
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 3. Run
```bash
cd backend
node server.js
```
Open http://localhost:5000

---

## Railway Deployment

### Steps
1. Push this repo to GitHub
2. Create Railway project → "Deploy from GitHub repo"
3. Set root directory to `backend/`
4. Add all env vars from `backend/.env` in Railway dashboard
5. **Replace `YOUR_RAILWAY_APP_URL`** in these 3 env vars:
   - `FRONTEND_URL=https://your-app.up.railway.app`
   - `APP_URL=https://your-app.up.railway.app`
   - `GOOGLE_CALLBACK_URL=https://your-app.up.railway.app/api/auth/google/callback`

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   - `https://your-app.up.railway.app/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback` (for local dev)

---

## What Was Fixed & Improved

### 🔐 Auth & Google Sign-In
- Fixed Google OAuth callback URL to use relative redirect (works on any host)
- Fixed failure redirects to use `.html` extension
- Fixed token handling after Google OAuth
- Improved login form validation with inline errors
- Added user profile fetch after login/OAuth
- Fixed signup to handle OAuth callback too

### 🌐 Frontend-Backend Connection
- Fixed API URL detection for localhost vs production
- Fixed email verification and password reset URLs to use `.html` extension
- Improved SPA routing — handles routes both with and without `.html` extension
- Created missing CSS files (`styles/main.css`, `styles/components/components.css`)

### ⚙️ Settings
- Fully connected to backend API
- Profile save, password change, privacy, notifications all working
- Dark mode / theme switching implemented

### 🎨 Design System
- Created comprehensive CSS design system (`styles/main.css`)
- Dark mode support with CSS custom properties
- Consistent button, form, card, avatar, badge, modal, dropdown styles
- Responsive sidebar and layout

### 🛠️ Code Quality
- Improved helpers.js with sidebar builder, dark mode, formatting utils
- Fixed debounced search
- Added proper error messages for all auth failure types
