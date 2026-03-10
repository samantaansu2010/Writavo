# Writavo Backend - Project Structure & Organization

## 📁 Directory Structure

```
backend/
├── config/                    # Configuration files
│   ├── database.js           # MongoDB connection (supports MONGODB_URI & MONGO_URI)
│   ├── environment.js        # Environment variables loader
│   └── passport.js           # Google OAuth configuration
│
├── controllers/              # Request handlers organized by feature
│   ├── admin/
│   │   └── adminController.js
│   ├── analytics/
│   │   └── analyticsController.js
│   ├── auth/
│   │   └── authController.js
│   ├── community/
│   │   └── communityController.js
│   ├── content/
│   │   ├── bookmarkController.js
│   │   └── postController.js
│   ├── feed/
│   │   └── feedController.js
│   ├── media/
│   │   └── mediaController.js
│   ├── messaging/
│   │   └── messageController.js
│   ├── moderation/
│   │   └── reportController.js
│   ├── notification/
│   │   └── notificationController.js
│   ├── search/
│   │   └── searchController.js
│   └── user/
│       └── userController.js
│
├── middleware/               # Express middleware
│   └── authMiddleware.js     # JWT verification, role checks
│
├── models/                   # Mongoose schemas
│   ├── index.js             # Main export file (Comment, Like, Follow, Message, Notification, Newsletter, Media, Restack, Bookmark, Report, ReadingHistory, Analytics)
│   ├── User.js              # User model
│   ├── Post.js              # Post model
│   ├── Community.js         # Community model
│   ├── ChannelMessage.js    # Channel messages
│   └── ... (all database models)
│
├── routes/                   # API route definitions
│   ├── authRoutes.js        # /api/auth endpoints
│   ├── postRoutes.js        # /api/posts endpoints
│   ├── communityAndFeedRoutes.js  # /api/communities & /api/feed
│   ├── otherRoutes.js       # /api/users, /api/notifications, /api/messages, /api/search, /api/media
│   └── adminRoutes.js       # /api/admin endpoints
│
├── services/                 # Business logic
│   └── recommendationEngine.js  # Feed algorithms
│
├── sockets/                  # WebSocket handlers
│   └── socketHandler.js      # Socket.io connection logic
│
├── utils/                    # Helper functions
│   ├── apiResponse.js        # Response formatting utilities
│   ├── authHelpers.js        # JWT & password utilities
│   └── emailHelper.js        # Email sending
│
├── uploads/                  # File storage (created automatically)
│
├── middleware/               # Express middleware
│   └── authMiddleware.js     # Authentication & authorization
│
├── server.js                 # Entry point
├── package.json              # Dependencies
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
├── .dockerignore              # Docker build ignore
└── Dockerfile                # Container configuration
```

## 🔌 Database Models

Models are defined in `models/` and re-exported from `models/index.js`:

| Model | Purpose |
|-------|---------|
| `User` | User accounts & profiles |
| `Post` | Blog posts & articles |
| `Community` | User communities |
| `Comment` | Post comments (threads) |
| `Like` | Post & comment likes |
| `Follow` | User follow relationships |
| `Message` | Direct messages & channel messages |
| `Notification` | User notifications |
| `Newsletter` | Newsletter subscriptions |
| `Media` | User-uploaded files |
| `Restack` | Post reshares |
| `Bookmark` | Saved posts (from `Bookmark` export) |
| `Report` | Content reports |
| `ReadingHistory` | Post view history |
| `Analytics` | Event tracking |

## 🔀 Import Paths

Controllers use relative paths to access models and utilities:

```javascript
// From: backend/controllers/auth/authController.js
import User from '../../models/User.js'                    // → backend/models/User.js
import { Follow } from '../../models/index.js'            // → backend/models/index.js
import { successResponse } from '../../utils/apiResponse.js' // → backend/utils/apiResponse.js
import config from '../../config/environment.js'          // → backend/config/environment.js
```

All controllers follow this **2-level-up** pattern:
- `controllers/[feature]/[file].js` → `../../[target]` ✓

## 🛣️ API Routes

| Base Path | File | Purpose |
|-----------|------|---------|
| `/api/auth` | `authRoutes.js` | Authentication (signup, login, verify email, password reset) |
| `/api/posts` | `postRoutes.js` | Posts CRUD, comments, likes |
| `/api/users` | `otherRoutes.js` | User profiles, follow, search |
| `/api/notifications` | `otherRoutes.js` | User notifications |
| `/api/messages` | `otherRoutes.js` | Direct messages |
| `/api/search` | `otherRoutes.js` | Global search |
| `/api/media` | `otherRoutes.js` | File uploads & management |
| `/api/communities` | `communityAndFeedRoutes.js` | Communities CRUD & channels |
| `/api/feed` | `communityAndFeedRoutes.js` | Personalized feed, trending |
| `/api/admin` | `adminRoutes.js` | Admin panel (user management, moderation, analytics) |

## 🔐 Environment Variables

### Required for All Environments

```env
# Server
NODE_ENV=production
PORT=5000              # Default: 5000
HOST=0.0.0.0          # Default: 0.0.0.0 (for Docker/Railway)

# Database (supports both formats)
MONGODB_URI=mongodb+srv://...  # Standard format
# OR for Railway:
MONGO_URI=mongodb+srv://...    # Railway auto-provides this
```

### Authentication

```env
JWT_SECRET=<random 32+ chars>
JWT_REFRESH_SECRET=<random 32+ chars>
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d
```

### Email (Optional)

```env
ENABLE_EMAIL_VERIFICATION=true
EMAIL_SERVICE=gmail
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password  # Use Gmail App Passwords, not regular password
```

### Google OAuth (Optional)

```env
ENABLE_GOOGLE_AUTH=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://YOUR-APP.up.railway.app/api/auth/google/callback
```

### CORS & Frontend

```env
CORS_ORIGIN=*                                    # For dev
# OR for production:
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

FRONTEND_URL=https://yourdomain.com             # For email links & OAuth redirects
```

## 🚀 Railway Deployment

### Key Settings

1. **Environment Variables** (set in Railway dashboard):
   ```
   MONGO_URI = <your MongoDB connection string>
   PORT = 5000  (Railway auto-assigns, but we provide default)
   NODE_ENV = production
   JWT_SECRET = <generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   ```

2. **Dockerfile** automatically provided - Railway builds with:
   - Node.js runtime
   - npm dependencies installed
   - `npm start` to run `node server.js`

3. **Database Connection**:
   - Code now supports both `MONGODB_URI` and `MONGO_URI`
   - Railway provides `MONGO_URI` → we fallback to it automatically
   - Connection string must have `retryWrites=true` for Railway stability

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT authentication |
| `bcryptjs` | Password hashing |
| `multer` | File uploads |
| `sharp` | Image optimization |
| `socket.io` | Real-time messaging |
| `passport` | OAuth authentication |
| `nodemailer` | Email sending |
| `helmet` | Security headers |
| `cors` | Cross-origin requests |

## 🔄 Request Flow Example

### User Auth Flow:
1. Request: `POST /api/auth/signup`
2. Routing: `server.js` → `authRoutes.js` → `authController.signup()`
3. Database: Controller imports `User` from `../../models/User.js`
4. Response: Formatted via `successResponse()` from `utils/apiResponse.js`

### Post Create Flow:
1. Request: `POST /api/posts` (requires auth)
2. Routing: `server.js` → `postRoutes.js`
3. Middleware: `protect` verifies JWT, attaches `req.user`
4. Controller: `postController.createPost()` handles logic
5. Models: Uses `Post`, `Follow`, `Notification` from `models/`
6. Response: Formatted response sent to client

## 🔗 Database Relationships

```
User
├── Posts (one-to-many)
├── Followers (through Follow)
├── Following (through Follow)
├── Messages (as sender/recipient)
├── Notifications
├── Communities (membership)
└── Media files

Post
├── Comments (one-to-many)
├── Likes (one-to-many)
├── Restacks (one-to-many)
├── Author (User)
└── Community (optional)

Community
├── Members (Users)
├── Channels (messages)
└── Owner (User)
```

## ✅ Controllers & Their Functions

| Controller | Key Functions |
|------------|----------------|
| `authController` | signup, login, verify-email, refresh-token, password-reset |
| `userController` | getProfile, updateProfile, follow, getFollowers |
| `postController` | createPost, getPosts, likePost, addComment |
| `bookmarkController` | toggleBookmark, getMyBookmarks |
| `messageController` | sendMessage, getConversations, getMessages |
| `notificationController` | getNotifications, markRead, markAllRead |
| `mediaController` | uploadMedia, getMyMedia, deleteMedia |
| `communityController` | getCommunities, joinCommunity, createChannel |
| `feedController` | getPersonalizedFeed, getTrending, getExplore |
| `searchController` | globalSearch (users, posts, communities) |
| `reportController` | createReport, reviewReport (admin) |
| `analyticsController` | trackEvent, getAdminStats |
| `adminController` | getUsers, banUser, changeRole |

## 🛠️ Development

### Running Locally

```bash
cd backend
npm install
npm run dev           # With nodemon auto-reload
# OR
npm start             # Standard node
```

### Database Migrations

```bash
npm run migrate       # Run indexes migration
npm run seed          # Seed database with initial data
```

### Production Build

```bash
NODE_ENV=production npm start
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ERR_MODULE_NOT_FOUND` | Check import paths are relative to file location (use `../../`) |
| `MONGODB_URI not defined` | Set `MONGODB_URI` or `MONGO_URI` in .env |
| `Authentication failed` | Verify JWT_SECRET is same across all instances |
| `CORS error` | Check `CORS_ORIGIN` includes your frontend URL |
| `Port already in use` | Change PORT env var or kill process on port 5000 |

## 📝 Notes

- **All controllers organized by feature** for maintainability
- **Centralized model exports** in `models/index.js`
- **Response formatting** centralized in `utils/apiResponse.js`
- **Error handling** consistent across all endpoints
- **Socket.io** for real-time messaging & notifications
- **Rate limiting** enabled to prevent abuse
- **Helmet.js** provides security headers
- **Compression** reduces response sizes
- **Morgan** logs all requests in dev/production

---

**Version:** 2.0.0  
**Last Updated:** March 2026  
**Status:** Production-Ready for Railway
