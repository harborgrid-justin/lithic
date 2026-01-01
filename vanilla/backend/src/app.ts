import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { logger } from "./utils/logger";
import {
  errorHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException,
} from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";
import { auditLog } from "./middleware/audit";

// Load environment variables
dotenv.config();

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

class App {
  public app: Application;
  private port: number;
  private host: string;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || "3000");
    this.host = process.env.HOST || "localhost";

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      }),
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:8080",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["X-Total-Count", "X-Page-Count"],
        maxAge: 86400, // 24 hours
      }),
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Cookie parser
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Rate limiting
    this.app.use(generalLimiter);

    // Audit logging
    if (process.env.HIPAA_AUDIT_ENABLED === "true") {
      this.app.use(auditLog);
    }

    // Request ID
    this.app.use((req: any, res, next) => {
      req.id = crypto.randomUUID();
      res.setHeader("X-Request-ID", req.id);
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      const startTime = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - startTime;
        logger.info("HTTP Request", {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });
      });

      next();
    });
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: "Lithic Healthcare Platform is running",
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || "development",
          version: "0.1.0",
        },
      });
    });

    // API version
    this.app.get("/api/v1", (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: "Lithic Healthcare API v1",
        data: {
          version: "1.0.0",
          endpoints: {
            auth: "/api/v1/auth",
            users: "/api/v1/users",
            patients: "/api/v1/patients",
            appointments: "/api/v1/appointments",
            medicalRecords: "/api/v1/medical-records",
            prescriptions: "/api/v1/prescriptions",
            billing: "/api/v1/billing",
          },
          documentation: "/api/v1/docs",
        },
      });
    });

    // TODO: Import and mount route modules here
    // Example:
    // import authRoutes from './routes/auth';
    // import userRoutes from './routes/users';
    // import patientRoutes from './routes/patients';
    // this.app.use('/api/v1/auth', authRoutes);
    // this.app.use('/api/v1/users', authenticate, userRoutes);
    // this.app.use('/api/v1/patients', authenticate, patientRoutes);
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public listen(): void {
    this.app.listen(this.port, this.host, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏥 Lithic Enterprise Healthcare Platform                ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV || "development"}
║   Server:      http://${this.host}:${this.port}
║   Health:      http://${this.host}:${this.port}/health
║   API:         http://${this.host}:${this.port}/api/v1
║                                                            ║
║   HIPAA Compliant ✓                                        ║
║   Audit Logging ${process.env.HIPAA_AUDIT_ENABLED === "true" ? "✓" : "✗"}
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal received: closing HTTP server");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT signal received: closing HTTP server");
      process.exit(0);
    });
  }
}

// Create and start the application
const app = new App();
app.listen();

export default app.app;
