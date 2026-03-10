import dotenv from 'dotenv';
dotenv.config();

const config = {
  NODE_ENV:  process.env.NODE_ENV  || 'development',
  PORT:      parseInt(process.env.PORT, 10) || 5000,
  HOST:      process.env.HOST || '0.0.0.0',

  // Support both MONGODB_URI (standard) and MONGO_URI (Railway)
  MONGODB_URI:     process.env.MONGODB_URI || process.env.MONGO_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'writavo',

  JWT_SECRET:             process.env.JWT_SECRET || 'writavo_dev_secret_CHANGE_IN_PROD',
  JWT_EXPIRATION:         process.env.JWT_EXPIRATION || '7d',
  JWT_REFRESH_SECRET:     process.env.JWT_REFRESH_SECRET || 'writavo_refresh_secret_CHANGE_IN_PROD',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '30d',

  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,

  EMAIL_SERVICE:    process.env.EMAIL_SERVICE    || 'gmail',
  EMAIL_USER:       process.env.EMAIL_USER,
  EMAIL_PASSWORD:   process.env.EMAIL_PASSWORD,
  EMAIL_FROM_NAME:  process.env.EMAIL_FROM_NAME  || 'Writavo',
  EMAIL_FROM_EMAIL: process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER,

  GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:  process.env.GOOGLE_CALLBACK_URL,

  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800,
  UPLOAD_DIR:    process.env.UPLOAD_DIR || './uploads',

  // Railway serves frontend from the same origin — use APP_URL on Railway
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000',

  // CORS: comma-separated list OR '*' for dev
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim()),

  RATE_LIMIT_WINDOW_MS:   parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)   || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 200,

  SOCKET_CORS_ORIGIN: process.env.SOCKET_CORS_ORIGIN || '*',

  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
  MAX_PAGE_SIZE:     parseInt(process.env.MAX_PAGE_SIZE, 10)     || 100,

  ENABLE_GOOGLE_AUTH:        process.env.ENABLE_GOOGLE_AUTH        === 'true',
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
};

export default config;
