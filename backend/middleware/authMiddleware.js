import { verifyAccessToken } from '../utils/authHelpers.js';
import User from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) return errorResponse(res, 401, 'Not authenticated. Please log in.');

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) return errorResponse(res, 401, 'User no longer exists.');
    if (!user.isActive) return errorResponse(res, 401, 'Account has been deactivated.');
    if (user.changedPasswordAfter(decoded.iat)) return errorResponse(res, 401, 'Password changed recently. Please log in again.');

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return errorResponse(res, 401, 'Invalid token.');
    if (error.name === 'TokenExpiredError') return errorResponse(res, 401, 'Token expired. Please log in again.');
    return errorResponse(res, 500, 'Authentication error.');
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = await User.findById(decoded.id);
    }
  } catch (_) { /* ignore */ }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return errorResponse(res, 403, 'Access denied. Admins only.');
  next();
};

export const ownerOrAdmin = (getOwnerId) => async (req, res, next) => {
  const ownerId = await getOwnerId(req);
  if (req.user.role === 'admin' || req.user._id.toString() === ownerId?.toString()) return next();
  return errorResponse(res, 403, 'Access denied.');
};
