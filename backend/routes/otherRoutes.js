import express from 'express';
import * as userController from '../controllers/user/userController.js';
import * as notifController from '../controllers/notification/notificationController.js';
import * as searchController from '../controllers/search/searchController.js';
import * as messageController from '../controllers/messaging/messageController.js';
import { uploadMedia, getMyMedia, deleteMedia, upload } from '../controllers/media/mediaController.js';
import { getMyBookmarks, toggleBookmark } from '../controllers/content/bookmarkController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

// USER ROUTES
export const userRouter = express.Router();
userRouter.get('/search',             optionalAuth, userController.searchUsers);
userRouter.get('/me/bookmarks',       protect,      getMyBookmarks);
userRouter.put('/profile',            protect,      userController.updateProfile);
userRouter.put('/settings',           protect,      userController.updateSettings);
userRouter.get('/:username',          optionalAuth, userController.getProfile);
userRouter.get('/:username/posts',    optionalAuth, userController.getUserPosts);
userRouter.post('/:id/follow',        protect,      userController.followUser);
userRouter.get('/:id/followers',                    userController.getFollowers);
userRouter.get('/:id/following',                    userController.getFollowing);

// NOTIFICATION ROUTES
export const notifRouter = express.Router();
notifRouter.use(protect);
notifRouter.get('/',            notifController.getNotifications);
notifRouter.put('/read-all',    notifController.markAllRead);
notifRouter.put('/:id/read',    notifController.markRead);
notifRouter.delete('/:id',      notifController.deleteNotification);

// SEARCH ROUTES
export const searchRouter = express.Router();
searchRouter.get('/',           optionalAuth, searchController.globalSearch);
searchRouter.get('/trending',               searchController.getTrending);

// MESSAGE ROUTES
export const messageRouter = express.Router();
messageRouter.use(protect);
messageRouter.get('/conversations',             messageController.getConversations);
messageRouter.get('/:userId',                   messageController.getMessages);
messageRouter.post('/:userId',                  messageController.sendMessage);
messageRouter.delete('/:messageId',             messageController.deleteMessage);

// MEDIA ROUTES
export const mediaRouter = express.Router();
mediaRouter.use(protect);
mediaRouter.post('/upload', upload.single('file'), uploadMedia);
mediaRouter.get('/',                              getMyMedia);
mediaRouter.delete('/:id',                        deleteMedia);
