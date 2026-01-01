import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.string().transform(Number).default('10'),
  
  // Security
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  COOKIE_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // CORS
  CORS_ORIGINS: z.string().transform((str) => str.split(',')),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // HIPAA Compliance
  AUDIT_LOG_RETENTION_DAYS: z.string().transform(Number).default('2555'),
  SESSION_TIMEOUT_MINUTES: z.string().transform(Number).default('15'),
  
  // External Services (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // S3 for file storage
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // HL7/FHIR Integration
  HL7_ENDPOINT: z.string().url().optional(),
  FHIR_BASE_URL: z.string().url().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

const env = parseEnv();

// Export typed configuration
export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  
  database: {
    url: env.DATABASE_URL,
    poolSize: env.DATABASE_POOL_SIZE,
  },
  
  security: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    encryptionKey: env.ENCRYPTION_KEY,
  },
  
  cookieSecret: env.COOKIE_SECRET,
  corsOrigins: env.CORS_ORIGINS,
  logLevel: env.LOG_LEVEL,
  
  hipaa: {
    auditLogRetentionDays: env.AUDIT_LOG_RETENTION_DAYS,
    sessionTimeoutMinutes: env.SESSION_TIMEOUT_MINUTES,
  },
  
  smtp: env.SMTP_HOST ? {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT!,
    user: env.SMTP_USER!,
    pass: env.SMTP_PASS!,
  } : undefined,
  
  aws: env.AWS_REGION ? {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    s3Bucket: env.AWS_S3_BUCKET!,
  } : undefined,
  
  integration: {
    hl7Endpoint: env.HL7_ENDPOINT,
    fhirBaseUrl: env.FHIR_BASE_URL,
  },
} as const;

// Type export
export type Config = typeof config;
