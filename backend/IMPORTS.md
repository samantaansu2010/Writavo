# Writavo Backend - Import Paths Reference

## Quick Reference

All controllers are 2 levels deep in the folder hierarchy, so imports use `../../`:

```
backend/
  controllers/
    [feature]/
      [controller].js  ←  Located HERE
              ↓
         Goes UP 2: ../../
```

## Import Path Patterns

### From Controllers

```javascript
// In: backend/controllers/auth/authController.js

// Models (always 2 levels up)
import User from '../../models/User.js'
import { Follow, Notification } from '../../models/index.js'

// Config
import config from '../../config/environment.js'

// Utils
import { successResponse, errorResponse } from '../../utils/apiResponse.js'
import { generateTokenPair } from '../../utils/authHelpers.js'
import { sendVerificationEmail } from '../../utils/emailHelper.js'

// Middleware
import { protect } from '../../middleware/authMiddleware.js'
```

### From Routes

```javascript
// In: backend/routes/authRoutes.js

import * as authController from '../controllers/auth/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import config from '../config/environment.js'
```

### From Utils

```javascript
// In: backend/utils/authHelpers.js

import jwt from 'jsonwebtoken'
import config from '../config/environment.js'
```

### From Models

```javascript
// In: backend/models/index.js

import mongoose from 'mongoose'

// Models in same file:
const userSchema = new mongoose.Schema({...})
export const User = mongoose.model('User', userSchema)

// Or import from separate file:
export { default as Community } from './Community.js'
```

---

## File Structure & Import Destination

```
backend/
│
├── controllers/
│   ├── auth/authController.js
│   ├── user/userController.js
│   ├── content/postController.js
│   ├── content/bookmarkController.js
│   ├── messaging/messageController.js
│   ├── notification/notificationController.js
│   ├── media/mediaController.js
│   ├── search/searchController.js
│   ├── analytics/analyticsController.js
│   ├── moderation/reportController.js
│   ├── admin/adminController.js
│   ├── community/communityController.js
│   └── feed/feedController.js
│
├── models/
│   ├── User.js                    (imported as: import User from '../../models/User.js')
│   ├── Post.js                    (imported as: import Post from '../../models/Post.js')
│   ├── Community.js               (imported as: import Community from '../../models/Community.js')
│   ├── ChannelMessage.js          (imported as: import ChannelMessage from '../../models/ChannelMessage.js')
│   └── index.js                   (exports multiple models)
│
├── routes/                        (imports: import * from '../controllers/...')
│   ├── authRoutes.js
│   ├── postRoutes.js
│   ├── otherRoutes.js
│   ├── communityAndFeedRoutes.js
│   └── adminRoutes.js
│
├── config/
│   ├── database.js               (db connection logic)
│   ├── environment.js             (env variables config)
│   └── passport.js                (OAuth setup)
│
├── utils/
│   ├── apiResponse.js             (response helpers)
│   ├── authHelpers.js             (JWT & bcrypt helpers)
│   └── emailHelper.js             (email sending)
│
├── middleware/
│   └── authMiddleware.js          (JWT verification, roles)
│
├── sockets/
│   └── socketHandler.js           (WebSocket handling)
│
├── services/
│   └── recommendationEngine.js    (business logic)
│
└── server.js                      (entry point)
```

---

## Models Exports from `models/index.js`

```javascript
// Exported directly in index.js
export const Comment = mongoose.model('Comment', commentSchema)
export const Like = mongoose.model('Like', likeSchema)
export const Follow = mongoose.model('Follow', followSchema)
export const Message = mongoose.model('Message', messageSchema)
export const Notification = mongoose.model('Notification', notificationSchema)
export const Newsletter = mongoose.model('Newsletter', newsletterSchema)
export const Media = mongoose.model('Media', mediaSchema)
export const Restack = mongoose.model('Restack', restackSchema)
export const Bookmark = mongoose.model('Bookmark', bookmarkSchema)
export const Report = mongoose.model('Report', reportSchema)
export const ReadingHistory = mongoose.model('ReadingHistory', readingHistorySchema)
export const Analytics = mongoose.model('Analytics', analyticsSchema)

// Imported from separate files
export { default as Community } from './Community.js'
export { default as ChannelMessage } from './ChannelMessage.js'
```

### Individual Model Files

```javascript
// User.js: export default
import mongoose from 'mongoose'
const userSchema = new mongoose.Schema({...})
export default mongoose.model('User', userSchema)

// Post.js: export default
import mongoose from 'mongoose'
const postSchema = new mongoose.Schema({...})
export default mongoose.model('Post', postSchema)

// Community.js: export default
import mongoose from 'mongoose'
const communitySchema = new mongoose.Schema({...})
export default mongoose.model('Community', communitySchema)

// ChannelMessage.js: export default
import mongoose from 'mongoose'
const channelMessageSchema = new mongoose.Schema({...})
export default mongoose.model('ChannelMessage', channelMessageSchema)
```

---

## Route-to-Controller Imports

```javascript
// backend/routes/authRoutes.js
import express from 'express'
import * as authController from '../controllers/auth/authController.js'
//                                 └── goes UP 1 level (from routes/ to backend/)
//                                 └── then DOWN into controllers/auth/

// Usage:
router.post('/signup', authController.signup)

// backend/controllers/auth/authController.js
export const signup = async (req, res) => {
  // import User from '../../models/User.js'
  //                      └── goes UP 2 levels (from auth/ to controllers/ to backend/)
  //                      └── then DOWN into models/
}
```

---

## Common Import Mistakes (❌ vs ✅)

### Mistake 1: Wrong Depth

```javascript
// ❌ WRONG - insufficient levels
import User from '../models/User.js'  // From: controllers/auth/authController.js

// ✅ CORRECT
import User from '../../models/User.js'
```

### Mistake 2: Missing File Extension

```javascript
// ❌ WRONG - Node.js ES modules require .js
import User from '../../models/User'

// ✅ CORRECT
import User from '../../models/User.js'
```

### Mistake 3: Absolute Paths (Node.js modules)

```javascript
// ❌ WRONG - not a Node.js module
import User from '/models/User.js'

// ✅ CORRECT
import User from '../../models/User.js'
```

### Mistake 4: Inconsistent Exports

```javascript
// ❌ INCONSISTENT - mixing export styles
export User from './User.js'      // named export
export default Post from './Post.js'  // default export

// ✅ CONSISTENT
export { default as User } from './User.js'
export { default as Post } from './Post.js'
// OR
export const Comment = mongoose.model(...)
export const Like = mongoose.model(...)
```

---

## Testing Imports Locally

### Quick Test Method

```bash
cd backend
node -e "import('./models/User.js').then(m => console.log('✓ User.js imports correctly')).catch(e => console.error('✗ Error:', e.message))"
```

### Test All Controller Imports

```bash
# Test auth controller
node -e "import('./controllers/auth/authController.js').then(() => console.log('✓ OK')).catch(e => console.error('✗', e.message))"

# Test post controller
node -e "import('./controllers/content/postController.js').then(() => console.log('✓ OK')).catch(e => console.error('✗', e.message))"
```

---

## Environment-Specific Imports

### MongoDB Connection

```javascript
// backend/config/database.js - handles both MONGODB_URI & MONGO_URI
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI

// Usage in controllers:
// Controllers don't import database directly
// server.js calls connectDB() on startup
```

### Configuration

```javascript
// backend/config/environment.js
export default {
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  // ... other configs
}

// Usage in any file:
import config from '../../config/environment.js'
console.log(config.PORT)
```

---

## Debugging Import Errors

### Error: `Cannot find module '../../models/User.js'`

**Causes**:
1. File doesn't exist
2. Wrong path (too many or too few `../`)
3. Wrong filename (case-sensitive on Linux/Mac)
4. Missing `.js` extension

**Solution**:
```javascript
// Count directory levels
// Current: controllers/auth/authController.js
// Target:  models/User.js
//
// auth/ → controllers/ → backend/ ← 2 levels up
// backend/ → models/ ← 1 level down
// Total: ../../models/User.js ✓
```

### Error: `ERR_MODULE_NOT_FOUND`

**On Railway**: Likely a committed path issue

**Solution**:
1. Test locally: `npm start`
2. Check all files are in git: `git status`
3. Commit missing files: `git add .`
4. Push and redeploy

### Error: `Cannot use import statement outside a module`

**Cause**: package.json missing `"type": "module"`

**Solution**:
```json
{
  "type": "module",
  "main": "server.js"
}
```

---

## Best Practices

✅ **DO**:
- Use consistent file extensions (always `.js`)
- Use relative paths for internal imports
- Group related imports at top of file
- Use destructuring for multiple imports
- Keep import paths as short as possible

❌ **DON'T**:
- Mix absolute and relative paths
- Omit file extensions in Node.js ES modules
- Use `require()` for ES modules
- Create circular dependencies
- Import deeply nested files (restructure instead)

---

## Summary Table

| Location | Target | Path | Example |
|----------|--------|------|---------|
| `controllers/auth/` | `models/` | `../../models/` | `../../models/User.js` |
| `controllers/user/` | `config/` | `../../config/` | `../../config/environment.js` |
| `controllers/*/` | `utils/` | `../../utils/` | `../../utils/apiResponse.js` |
| `routes/` | `controllers/` | `../controllers/` | `../controllers/auth/authController.js` |
| `routes/` | `middleware/` | `../middleware/` | `../middleware/authMiddleware.js` |
| `utils/` | `config/` | `../config/` | `../config/environment.js` |
| `sockets/` | `models/` | `../models/` | `../models/index.js` |

---

**Last Updated**: March 2026  
**Use this guide**: When adding new files, follow the same patterns shown here
