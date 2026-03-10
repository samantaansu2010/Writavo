import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/admin/adminController.js';
import * as reportController from '../controllers/moderation/reportController.js';
import * as analyticsController from '../controllers/analytics/analyticsController.js';
const router = express.Router();

// ── Platform Stats (admin only) ───────────────────────────────────────────
router.get('/stats',                  protect, adminOnly, adminController.getStats);

// ── User Management (admin only) ─────────────────────────────────────────
router.get('/users',                  protect, adminOnly, adminController.getUsers);
router.put('/users/:id/ban',          protect, adminOnly, adminController.banUser);
router.put('/users/:id/unban',        protect, adminOnly, adminController.unbanUser);
router.put('/users/:id/role',         protect, adminOnly, adminController.changeRole);

// ── Post Moderation (admin only) ──────────────────────────────────────────
router.get('/posts',                  protect, adminOnly, adminController.getAllPosts);
router.delete('/posts/:id',           protect, adminOnly, adminController.adminDeletePost);

// ── Reports ───────────────────────────────────────────────────────────────
router.post('/reports',               protect,            reportController.createReport);   // any user
router.get('/reports',                protect, adminOnly, reportController.getReports);
router.put('/reports/:id',            protect, adminOnly, reportController.reviewReport);

// ── Analytics ─────────────────────────────────────────────────────────────
router.post('/track',                                     analyticsController.trackEvent);  // public

export default router;
