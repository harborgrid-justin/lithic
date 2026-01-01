import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { auditLogger } from './middleware/auditLogger.js';

const app = express();

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
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookieSecret));
app.use(compression());

// Logging middleware
app.use(requestLogger);
app.use(auditLogger);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API routes will be imported and mounted here
// Example:
// import authRoutes from './routes/auth.js';
// app.use('/api/v1/auth', authRoutes);

// Routes placeholder - agents will add their routes here
app.use('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Lithic Healthcare API v1',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      patients: '/api/v1/patients',
      clinical: '/api/v1/clinical',
      scheduling: '/api/v1/scheduling',
      billing: '/api/v1/billing',
      laboratory: '/api/v1/laboratory',
      pharmacy: '/api/v1/pharmacy',
      imaging: '/api/v1/imaging',
      analytics: '/api/v1/analytics',
      admin: '/api/v1/admin',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: req.path,
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server started on port ${config.port} in ${config.nodeEnv} mode`);
  logger.info(`Health check available at http://localhost:${config.port}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections
    // prisma.$disconnect();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
