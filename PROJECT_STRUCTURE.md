# Writavo Project Structure

## Corrected Folder Structure

```
writavo-platform/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection (uses MONGODB_URI or MONGO_URI)
│   │   ├── environment.js       # Environment variables
│   │   └── passport.js          # Google OAuth
│   ├── controllers/
│   │   ├── admin/
│   │   │   └── adminController.js
│   │   ├── analytics/
│   │   │   └── analyticsController.js
│   │   ├── auth/
│   │   │   └── authController.js
│   │   ├── community/
│   │   │   └── communityController.js
│   │   ├── content/
│   │   │   ├── bookmarkController.js
│   │   │   └── postController.js
│   │   ├── feed/
│   │   │   └── feedController.js
│   │   ├── media/
│   │   │   └── mediaController.js
│   │   ├── messaging/
│   │   │   └── messageController.js
│   │   ├── moderation/
│   │   │   └── reportController.js   ← createReport, getReports, reviewReport
│   │   ├── notification/
│   │   │   └── notificationController.js
│   │   ├── search/
│   │   │   └── searchController.js
│   │   └── user/
│   │       └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Community.js
│   │   └── ChannelMessage.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   ├── otherRoutes.js
│   │   └── communityAndFeedRoutes.js
│   ├── services/
│   │   └── recommendationEngine.js
│   ├── sockets/
│   │   └── socketHandler.js
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── authHelpers.js
│   │   └── emailHelper.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── database/
│   ├── migrations/
│   │   └── 001_indexes.js
│   └── seeders/
│       └── seed.js
├── frontend/
├── package.json
├── README.md
└── .gitignore
```

## Import Paths (All Correct)

### Routes → Controllers
| Route File       | Import Path                                      |
|------------------|--------------------------------------------------|
| adminRoutes.js   | `../controllers/admin/adminController.js`        |
| adminRoutes.js   | `../controllers/moderation/reportController.js`  |
| adminRoutes.js   | `../controllers/analytics/analyticsController.js`|
| authRoutes.js    | `../controllers/auth/authController.js`          |
| postRoutes.js    | `../controllers/content/postController.js`       |
| postRoutes.js    | `../controllers/content/bookmarkController.js`   |
| otherRoutes.js   | `../controllers/user/userController.js`          |
| otherRoutes.js   | `../controllers/notification/notificationController.js` |
| otherRoutes.js   | `../controllers/search/searchController.js`      |
| otherRoutes.js   | `../controllers/messaging/messageController.js`  |
| otherRoutes.js   | `../controllers/media/mediaController.js`        |
| otherRoutes.js   | `../controllers/content/bookmarkController.js`   |
| communityAndFeedRoutes.js | `../controllers/community/communityController.js` |
| communityAndFeedRoutes.js | `../controllers/feed/feedController.js`    |

### Controllers → Models/Utils
| From (controllers/X/) | To models | To utils | To config |
|------------------------|-----------|----------|-----------|
| authController.js      | `../../models/User.js` | `../../utils/authHelpers.js` etc. | `../../config/environment.js` |
| reportController.js    | `../../models/index.js`, `../../models/Post.js`, `../../models/User.js` | `../../utils/apiResponse.js` | - |

## reportController.js Functions

- **createReport** – Submit a content report (targetType, target, reason, description)
- **getReports** – List reports (admin, supports pagination, status filter)
- **reviewReport** – Review a report (status, resolution)

## Run Commands

```bash
npm install    # Installs backend deps via postinstall
npm start      # Starts server (Node 18+)
npm run dev    # Start with auto-reload
npm run seed   # Seed sample data
npm run migrate # Run migrations
```
