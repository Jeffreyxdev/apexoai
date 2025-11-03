import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import winston from 'winston';
import * as Sentry from '@sentry/node';

// Import routes
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import resumeRoutes from './routes/resume.route.js';
import coverLetterRoutes from './routes/coverLetter.route.js';
import chatRoutes from './routes/chat.route.js';
import jobRoutes from './routes/Job.route.js';
import documentRoutes from './routes/Document.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import adminRoutes from './routes/admin.route.js';

// Import middleware
import { errorHandler } from './middleware/errorHandle.js';
import { requestLogger } from './middleware/requestLogger.js';
import { validateRequest } from './middleware/validation.js';

// Import services
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { initSocketHandlers } from './service/socket.service.js';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});



console.log('--- ROUTE REGISTRATION START ---');

app._router && app._router.stack.forEach(r => {
  if (r.route) console.log(r.route.path);
  else if (r.name === 'router' && r.handle.stack) {
    r.handle.stack.forEach(layer => {
      if (layer.route) console.log(layer.route.path);
    });
  }
});

console.log('--- ROUTE REGISTRATION END ---');
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);


// --- Limiters ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit AI-heavy operations
  message: 'AI request limit exceeded. Please upgrade your plan.',
});

// --- Global Rate Limiter ---
app.use('/api', limiter);

// --- Health Check ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resumes', strictLimiter, resumeRoutes);         // apply stricter limiter here
app.use('/api/cover-letters', strictLimiter, coverLetterRoutes);
app.use('/api/chat', strictLimiter, chatRoutes);              // chat is AI-heavy
app.use('/api/jobs', jobRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);


// Socket.IO initialization
initSocketHandlers(io);

// 404 handler
app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Database and Redis connection
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('✅ Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected successfully');

    // Start server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      logger.info(`🚀 ApexoAI Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
      logger.info('='.repeat(50));
      logger.info('Available Services:');
      logger.info('  ✅ Authentication (JWT + OAuth)');
      logger.info('  ✅ AI Chat Engine (OpenAI GPT-4)');
      logger.info('  ✅ Resume Builder API');
      logger.info('  ✅ Cover Letter Generator');
      logger.info('  ✅ Job Recommendations');
      logger.info('  ✅ Document Export (PDF)');
      logger.info('  ✅ Real-time WebSocket');
      logger.info('  ✅ Payment Integration (Stripe)');
      logger.info('  ✅ Analytics Dashboard');
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    Sentry.captureException(error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      const mongoose = await import('mongoose');
      await mongoose.default.connection.close();
      logger.info('Database connection closed');

      // Close Redis connection
      const { redisClient } = await import('./config/redis.js');
      await redisClient.quit();
      logger.info('Redis connection closed');

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  Sentry.captureException(error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  Sentry.captureException(reason);
});

// Start the server
startServer();

export { app, io, logger };