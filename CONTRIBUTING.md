# Contributing to Writavo

Thanks for your interest in improving Writavo! 🎉

## Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/writavo.git
cd writavo/backend
cp .env.example .env        # fill in MONGODB_URI + JWT secrets
npm install
npm run dev                 # http://localhost:5000
```

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys to Railway |
| `develop` | Staging / integration |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

**Always branch from `develop`, never from `main`.**

```bash
git checkout develop
git pull
git checkout -b feature/your-feature-name
```

## Pull Request Checklist

- [ ] Code works locally (`npm run dev`)
- [ ] No `console.log` left in controllers
- [ ] New routes are documented in README
- [ ] `.env.example` updated if new env vars added
- [ ] PR targets `develop` branch, not `main`

## Project Structure

```
writavo/
├── backend/
│   ├── controllers/     # Business logic (grouped by domain)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── middleware/       # Auth, validation
│   ├── services/        # Recommendation engine etc.
│   ├── sockets/         # Socket.io handlers
│   ├── utils/           # Shared helpers
│   └── config/          # DB, env, passport
├── frontend/            # Vanilla HTML/CSS/JS pages
│   ├── scripts/api.js   # All API calls go through here
│   └── styles/          # Shared CSS (if any)
└── database/
    ├── seeders/         # Demo data
    └── migrations/      # Index setup
```

## Code Style

- ES Modules (`import/export`) — no CommonJS `require()`
- Async/await everywhere — no `.then()` chains
- All API responses use `successResponse()` / `errorResponse()` from `utils/apiResponse.js`
- Controllers never import other controllers — go through services if needed

## Reporting Bugs

Open an issue with:
1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Node.js version (`node -v`) and OS

## Questions?

Open a Discussion on GitHub or email hello@writavo.com
