# Railway Deployment Guide for Writavo

## ✅ Pre-Deployment Checklist

- [ ] MongoDB Atlas instance created (free tier works fine)
- [ ] Railway account created (https://railway.app)
- [ ] GitHub repository linked to Railway
- [ ] All environment variables set in Railway dashboard

## 🚀 Step-by-Step Deployment

### 1. Prepare MongoDB

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster (free M0 tier is fine for development)
3. Create a database named `writavo`
4. Create a user with appropriate permissions
5. Connect with connection string: `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/writavo?retryWrites=true&w=majority`

**Important**: Use `retryWrites=true` for Railway's unstable connections

### 2. Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select the `writavo-platform` repository
6. Configure to deploy from `backend/` directory

### 3. Set Environment Variables

In Railway dashboard:

```env
# Database - Railway will provide MONGO_URI automatically, but set it explicitly:
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/writavo?retryWrites=true&w=majority

# Server
NODE_ENV=production
PORT=5000

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
JWT_SECRET=<generate_a_long_random_string_here>
JWT_REFRESH_SECRET=<generate_another_long_random_string_here>
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# CORS (after first deploy, update with your Railway domain)
CORS_ORIGIN=https://YOUR-APP.up.railway.app
FRONTEND_URL=https://YOUR-APP.up.railway.app

# Email (optional)
ENABLE_EMAIL_VERIFICATION=true
EMAIL_SERVICE=gmail
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password

# Google OAuth (optional)
ENABLE_GOOGLE_AUTH=false
# Set to true and add credentials only if needed
```

### 4. Configure Dockerfile

The provided `Dockerfile` is already optimized for Railway:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

Railway automatically:
- Builds the Docker image
- Sets PORT environment variable
- Starts the server with `node server.js`

### 5. Deploy

1. Push code to GitHub
2. Railway auto-deploys on push (if GitHub integration enabled)
3. Monitor build & deployment in Railway dashboard
4. View logs in Railway dashboard

### 6. Verify Deployment

Once deployed, test health endpoint:

```bash
curl https://YOUR-APP.up.railway.app/api/health
```

Response:
```json
{
  "status": "success",
  "message": "🚀 Writavo API is running",
  "version": "2.0.0",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": "45s",
  "env": "production"
}
```

---

## 🔧 Environment Variables Explained

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `NODE_ENV` | Environment mode | `production` |
| `JWT_SECRET` | Access token signing key | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Refresh token signing key | Random 32+ char string |

### Optional Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 5000 | Server port (Railway overrides) |
| `CORS_ORIGIN` | `*` | Allowed frontend origins |
| `FRONTEND_URL` | `http://localhost:5000` | For email links & OAuth |
| `ENABLE_EMAIL_VERIFICATION` | `false` | Email verification on signup |
| `ENABLE_GOOGLE_AUTH` | `false` | Google OAuth login |
| `JWT_EXPIRATION` | `7d` | Access token lifetime |
| `JWT_REFRESH_EXPIRATION` | `30d` | Refresh token lifetime |

---

## 🐛 Troubleshooting Railway Deployment

### Build Fails: `Cannot find module`

**Cause**: Relative import paths are wrong or files missing

**Solution**:
1. Check all imports use correct paths relative to file location
2. Verify all files are committed to git (check local import issues first)
3. Rebuild: Dashboard → Redeploy

### Runtime Error: `MONGODB_URI not defined`

**Cause**: Environment variable not set or wrong name

**Solution**:
1. Go to Railway dashboard
2. Check `MONGO_URI` environment variable is set
3. Code now supports both `MONGODB_URI` and `MONGO_URI`
4. Trigger redeploy

### `Socket hang up` or Connection Errors

**Cause**: MongoDB connection timeout

**Solution**:
1. Verify MongoDB Atlas cluster is running
2. Check connection string has `retryWrites=true`
3. Add MongoDB to Railway plugins (optional)
4. Increase timeout values if needed

### Port Already in Use

**Cause**: Multiple instances or process not killed

**Solution**:
1. Railway manages this automatically
2. Check logs for lingering processes
3. Force restart via Railway dashboard

### Slow Response Times

**Cause**: Cold start or MongoDB latency

**Solution**:
1. Keep-alive requests via health endpoint pings
2. Use MongoDB connection pooling (already configured)
3. Consider upgrading MongoDB to M2+ tier

---

## 📊 Monitoring

### View Logs

1. Railway Dashboard → Your Project → Logs
2. Filter by service: `Backend`
3. Look for:
   - `✅ MongoDB Connected` - DB connection successful
   - `🚀 Writavo v2 running on port 5000` - Server started
   - Errors starting with `❌` - Issues to investigate

### Performance Metrics

Railway shows:
- **CPU Usage**: Monitor for spikes
- **Memory Usage**: Should stay <200MB
- **Requests**: Track API traffic
- **Response Times**: Monitor for slowdowns

### Set Up Alerts

1. Dashboard → Settings → Alerts
2. Alert on:
   - Deployment failures
   - High memory usage
   - HTTP errors (5xx)

---

## 🔄 Redeploying

### Automatic (Recommended)

GitHub integration redeplooys on push:
1. Make code changes
2. Commit & push to main branch
3. Railway auto-redeploys
4. Monitor logs

### Manual Redeploy

1. Railway Dashboard → Your Project
2. Click "Redeploy" button
3. Select deploy source (latest commit)
4. Wait for build & deployment

### Roll Back

1. Go to Deployments tab
2. Click on previous successful deployment
3. Click "Redeploy from this deployment"

---

## 🛡️ Security Best Practices

- ✅ Never commit `.env` file (use `.env.example`)
- ✅ Use strong JWT secrets (32+ random characters)
- ✅ Enable JWT expiration to force re-authentication
- ✅ Keep Node.js & packages updated
- ✅ Use HTTPS only (Railway provides free SSL)
- ✅ Enable rate limiting (already in code)
- ✅ Use Helmet for security headers (already in code)
- ✅ Validate all user inputs (implement in controllers)
- ✅ Use MongoDB authentication
- ✅ Regular database backups

---

## 📈 Scaling on Railway

### Vertical Scaling (CPU/Memory)

1. Dashboard → Settings → Plan
2. Select higher tier
3. Automatic restart with new resources

### Horizontal Scaling (Multiple Instances)

Railway can spawn multiple dynos:
1. Settings → Region & Scale
2. Increase instance count
3. Traffic automatically balanced

### Database Scaling

1. MongoDB Atlas → Cluster → Scale Out
2. Add sharding for large datasets
3. Monitor replication lag

---

## 🔗 Useful Links

- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Express.js Guide](https://expressjs.com)
- [Mongoose Docs](https://mongoosejs.com)

---

## Support & Debugging

### Reaching Out

1. Check recent changes in git history
2. Review Railway logs for specific errors
3. Test locally: `npm run dev`
4. Use Postman to test API endpoints

### Local Development Test

```bash
# Terminal 1: Local server
npm run dev

# Terminal 2: Test endpoints
curl http://localhost:5000/api/health
```

---

**Last Updated**: March 2026  
**Writavo Version**: 2.0.0  
**Status**: Production Ready ✅
