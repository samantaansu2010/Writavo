import express from 'express';
import passport from '../config/passport.js';
import * as authController from '../controllers/auth/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import config from '../config/environment.js';

const router = express.Router();

router.post('/signup',               authController.signup);
router.post('/login',                authController.login);
router.post('/refresh',              authController.refreshToken);
router.post('/verify-email',         authController.verifyEmail);
router.post('/resend-verification',  authController.resendVerification);
router.post('/forgot-password',      authController.forgotPassword);
router.post('/reset-password',       authController.resetPassword);
router.get('/me',                    protect, authController.getMe);
router.post('/logout',               protect, authController.logout);
router.post('/change-password',      protect, authController.changePassword);

// Google OAuth (only mounted when ENABLE_GOOGLE_AUTH=true)
if (config.ENABLE_GOOGLE_AUTH) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login.html?error=google_failed' }),
    authController.googleCallback
  );
}

export default router;

