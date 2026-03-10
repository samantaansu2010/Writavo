import User from '../../models/User.js'
import { generateTokenPair, generateSecureToken, hashToken, verifyRefreshToken } from '../../utils/authHelpers.js'
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../../utils/emailHelper.js'
import { successResponse, errorResponse } from '../../utils/apiResponse.js'
import config from '../../config/environment.js'

const sanitizeUser = (user) => {
  const u = user.toObject();
  delete u.password;
  delete u.emailVerificationToken;
  delete u.emailVerificationTokenExpires;
  delete u.passwordResetToken;
  delete u.passwordResetTokenExpires;
  delete u.passwordChangedAt;
  return u;
};

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, dateOfBirth, country, state, userType } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return errorResponse(res, 400, 'All required fields must be provided.');
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) return errorResponse(res, 409, 'Email is already registered.');

    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) return errorResponse(res, 409, 'Username is already taken.');

    const verificationToken = generateSecureToken();
    const hashedToken = hashToken(verificationToken);

    const user = await User.create({
      firstName, lastName, username, email, password,
      dateOfBirth, country, state, userType,
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(user, verificationToken).catch(console.error);

    const tokens = generateTokenPair(user._id, user.email, user.username);

    return successResponse(res, 201, 'Account created successfully. Please verify your email.', {
      user: sanitizeUser(user),
      ...tokens,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(res, 409, `${field} is already taken.`);
    }
    console.error('Signup error:', error);
    return errorResponse(res, 500, 'Failed to create account. Please try again.');
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 400, 'Email and password are required.');

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +passwordChangedAt');
    if (!user) return errorResponse(res, 401, 'Invalid email or password.');
    if (!user.password) return errorResponse(res, 401, 'Please sign in with Google for this account.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid email or password.');

    if (!user.isActive) return errorResponse(res, 401, 'Your account has been deactivated.');
    if (config.ENABLE_EMAIL_VERIFICATION && !user.emailVerified) {
      return errorResponse(res, 401, 'Please verify your email before logging in.');
    }

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    user.onlineStatus = 'online';
    await user.save({ validateBeforeSave: false });

    const tokens = generateTokenPair(user._id, user.email, user.username);
    return successResponse(res, 200, 'Login successful.', { user: sanitizeUser(user), ...tokens });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 500, 'Login failed. Please try again.');
  }
};

// POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return errorResponse(res, 400, 'Verification token is required.');

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationTokenExpires');

    if (!user) return errorResponse(res, 400, 'Invalid or expired verification token.');

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    sendWelcomeEmail(user).catch(console.error);
    return successResponse(res, 200, 'Email verified successfully! Welcome to Writavo.');
  } catch (error) {
    return errorResponse(res, 500, 'Email verification failed.');
  }
};

// POST /api/auth/resend-verification
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+emailVerificationToken +emailVerificationTokenExpires');
    if (!user) return errorResponse(res, 404, 'No account found with that email.');
    if (user.emailVerified) return errorResponse(res, 400, 'Email is already verified.');

    const verificationToken = generateSecureToken();
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    sendVerificationEmail(user, verificationToken).catch(console.error);
    return successResponse(res, 200, 'Verification email sent.');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to resend verification email.');
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    // Always return success to prevent user enumeration
    if (!user) return successResponse(res, 200, 'If that email is registered, a reset link has been sent.');

    const resetToken = generateSecureToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    sendPasswordResetEmail(user, resetToken).catch(console.error);
    return successResponse(res, 200, 'If that email is registered, a reset link has been sent.');
  } catch (error) {
    return errorResponse(res, 500, 'Password reset request failed.');
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return errorResponse(res, 400, 'Token and new password are required.');

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetTokenExpires');

    if (!user) return errorResponse(res, 400, 'Invalid or expired reset token.');

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    const tokens = generateTokenPair(user._id, user.email, user.username);
    return successResponse(res, 200, 'Password reset successfully.', tokens);
  } catch (error) {
    return errorResponse(res, 500, 'Password reset failed.');
  }
};

// GET /api/auth/me (protected)
export const getMe = async (req, res) => {
  return successResponse(res, 200, 'User profile retrieved.', { user: sanitizeUser(req.user) });
};

// POST /api/auth/logout (protected)
export const logout = async (req, res) => {
  try {
    req.user.onlineStatus = 'offline';
    req.user.lastActiveAt = new Date();
    await req.user.save({ validateBeforeSave: false });
    return successResponse(res, 200, 'Logged out successfully.');
  } catch (error) {
    return successResponse(res, 200, 'Logged out.');
  }
};

// POST /api/auth/change-password (protected)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, 401, 'Current password is incorrect.');

    user.password = newPassword;
    await user.save();
    const tokens = generateTokenPair(user._id, user.email, user.username);
    return successResponse(res, 200, 'Password changed successfully.', tokens);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to change password.');
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 400, 'Refresh token is required.');

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return errorResponse(res, 401, 'Invalid or expired refresh token.');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return errorResponse(res, 401, 'User not found or deactivated.');

    const tokens = generateTokenPair(user._id, user.email, user.username);
    return successResponse(res, 200, 'Tokens refreshed.', tokens);
  } catch (error) {
    return errorResponse(res, 500, 'Token refresh failed.');
  }
};

// GET /api/auth/google/callback — Passport already validated user, now issue JWT
export const googleCallback = async (req, res) => {
  try {
    const user = req.user; // set by passport strategy
    if (!user) {
      return res.redirect('/login?error=google_auth_failed');
    }
    const tokens = generateTokenPair(user._id, user.email, user.username);
    // Use relative redirect so it works on any host (Railway, localhost, custom domain)
    // Frontend login.html handles token extraction from URL params
    const isNew = user.emailVerified ? 'false' : 'true';
    return res.redirect(
      `/login.html?token=${encodeURIComponent(tokens.accessToken)}&refresh=${encodeURIComponent(tokens.refreshToken)}&new=${isNew}`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    return res.redirect('/login.html?error=oauth_failed');
  }
};
