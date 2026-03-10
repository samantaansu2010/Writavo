<<<<<<< HEAD
# Writavo

A writing and social platform for creators and communities — similar to Medium/Substack with community and messaging features.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env and set:
#   - MONGODB_URI or MONGO_URI (required)
#   - JWT_SECRET (required for auth)

# 3. Start the server
npm start
```

The backend serves both the API and frontend. Open **http://localhost:5000** in your browser. If port 5000 is in use, set `PORT=5001` (or another port) in `backend/.env`.

## Prerequisites

- **Node.js** 18 or higher
- **MongoDB** — use [MongoDB Atlas](https://cloud.mongodb.com) (free tier) or a local instance

## Project Structure

```
writavo-platform/
├── backend/                 # Node.js API server
│   ├── config/              # Database, environment, passport
│   ├── controllers/         # Request handlers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API route definitions
│   ├── middleware/          # Auth, etc.
│   ├── utils/               # Helpers
│   ├── sockets/             # WebSocket handlers
│   ├── server.js            # Entry point
│   └── .env.example         # Environment template
├── frontend/                # Static frontend (HTML, JS, CSS)
├── database/                # Seeders and migrations
└── package.json
```

## Environment Variables

Create `backend/.env` from `backend/.env.example`. Required:

| Variable      | Description                    |
|---------------|--------------------------------|
| MONGODB_URI or MONGO_URI | MongoDB connection string |
| JWT_SECRET    | Secret for JWT signing (32+ chars) |
| JWT_REFRESH_SECRET | Secret for refresh tokens |

Optional: `PORT` (default 5000), `JWT_EXPIRATION`, `CORS_ORIGIN`, etc.

## Scripts

| Command     | Description                    |
|-------------|--------------------------------|
| `npm install` | Install deps (root + backend) |
| `npm start`   | Start server (API + frontend) |
| `npm run dev` | Start with auto-reload        |

From `backend/`:

| Command              | Description        |
|----------------------|--------------------|
| `npm run seed`       | Seed sample data   |
| `npm run migrate`    | Run DB migrations  |

## API

- **Health:** `GET /api/health`
- **Auth:** `/api/auth/*` (signup, login, refresh, etc.)
- **Posts:** `/api/posts/*`
- **Users:** `/api/users/*`
- **Communities:** `/api/communities/*`
- **Messages:** `/api/messages/*`
- **Notifications:** `/api/notifications/*`
- **Search:** `/api/search/*`

## Git

The project includes a `.gitignore` that excludes:
- `node_modules/`
- `.env` (use `.env.example` as template)
- `backend/uploads/`
- Build outputs, logs, OS files

## License

MIT
=======
# Writaro_platform
A website where you will share your writings, notes, books 
>>>>>>> 2b6baef4fd9526ebfd1577996d0e7646694a112e
