import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import config from '../config/environment.js';

// ===================== JWT HELPERS =====================
export const generateAccessToken = (userId, email, username) => {
  return jwt.sign({ id: userId, email, username, type: 'access' }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRATION });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: 'refresh' }, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRATION });
};

export const generateTokenPair = (userId, email, username) => ({
  accessToken: generateAccessToken(userId, email, username),
  refreshToken: generateRefreshToken(userId),
});

export const verifyAccessToken = (token) => jwt.verify(token, config.JWT_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, config.JWT_REFRESH_SECRET);
export const decodeToken = (token) => jwt.decode(token);

// ===================== BCRYPT HELPERS =====================
export const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(config.BCRYPT_SALT_ROUNDS);
  return bcryptjs.hash(password, salt);
};

export const comparePassword = async (plain, hashed) => bcryptjs.compare(plain, hashed);

export const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/\d/.test(password)) errors.push('Password must contain at least one number');
  return { isValid: errors.length === 0, errors };
};

// ===================== RANDOM TOKEN =====================
import crypto from 'crypto';
export const generateSecureToken = () => crypto.randomBytes(32).toString('hex');
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
