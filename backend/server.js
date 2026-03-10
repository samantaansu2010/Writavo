import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import passportConfig from './config/passport.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import config from './config/environment.js';
import connectDB from './config/database.js';
import { setupSockets } from './sockets/socketHandler.js';

// Routes
import authRoutes        from './routes/authRoutes.js';
import postRoutes        from './routes/postRoutes.js';
import { userRouter, notifRouter, searchRouter, messageRouter, mediaRouter } from './routes/otherRoutes.js';
import { communityRouter, feedRouter } from './routes/communityAndFeedRoutes.js';
import adminRoutes       from './routes/adminRoutes.js';

// Ensure uploads dir exists
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

const app    = express();
const server = http.createServer(app);
const io     = new SocketIOServer(server, {
  cors: {
    origin:      config.SOCKET_CORS_ORIGIN === '*' ? '*' : config.SOCKET_CORS_ORIGIN.split(','),
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});

// ── Security ──────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

const corsOptions = {
  origin: config.CORS_ORIGIN.length === 1 && config.CORS_ORIGIN[0] === '*'
    ? '*'
    : config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};
app.use(cors(corsOptions));

app.use(rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max:      config.RATE_LIMIT_MAX_REQUESTS,
  message:  { status: 'error', message: 'Too many requests — slow down!' },
  standardHeaders: true,
  legacyHeaders:   false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(compression());
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
if (config.ENABLE_GOOGLE_AUTH) app.use(passportConfig.initialize());

// ── Static files ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve frontend (../frontend relative to backend/)
const frontendPath = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(frontendPath)) {
  app.use('/', express.static(frontendPath));
}

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status:    'success',
  message:   '🚀 Writavo API is running',
  version:   '2.0.0',
  timestamp: new Date().toISOString(),
  uptime:    `${Math.floor(process.uptime())}s`,
  env:       config.NODE_ENV,
}));

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/users',         userRouter);
app.use('/api/notifications', notifRouter);
app.use('/api/search',        searchRouter);
app.use('/api/messages',      messageRouter);
app.use('/api/media',         mediaRouter);
app.use('/api/communities',   communityRouter);
app.use('/api/feed',          feedRouter);
app.use('/api/admin',         adminRoutes);

// ── SPA fallback (serve HTML pages for non-API routes) ───────────────────
if (fs.existsSync(frontendPath)) {
  // Map routes without .html extension to .html files
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    
    // Try exact path first
    const exactPath = path.join(frontendPath, req.path);
    if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
      return res.sendFile(exactPath);
    }
    
    // Try with .html extension
    const htmlPath = path.join(frontendPath, req.path + '.html');
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }
    
    // Try index.html in directory
    const dirIndex = path.join(frontendPath, req.path, 'index.html');
    if (fs.existsSync(dirIndex)) {
      return res.sendFile(dirIndex);
    }
    
    // Fallback to main index
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    
    next();
  });
}

// ── 404 & Error handlers ──────────────────────────────────────────────────
app.use('/api/*', (req, res) =>
  res.status(404).json({ status: 'error', message: `Route ${req.path} not found` })
);

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.statusCode || 500).json({
    status:  'error',
    message: config.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// ── Socket.io ─────────────────────────────────────────────────────────────
setupSockets(io);
app.set('io', io);

// ── Start ─────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  const PORT = config.PORT;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Writavo v2 running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Env:    ${config.NODE_ENV}\n`);
  });

  const shutdown = () => server.close(() => { console.log('👋 Server closed'); process.exit(0); });
  process.on('SIGINT',  shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();
export { app, server, io };
