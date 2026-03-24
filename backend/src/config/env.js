/**
 * Environment Configuration Module
 * 
 * Centralizes all environment variable loading and validation.
 * Ensures required variables are present before app starts.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Validates that required environment variables are set
 * @param {string[]} required - Array of required env var names
 * @throws {Error} if any required variable is missing
 */
const validateEnv = (required) => {
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file against .env.example'
    );
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

validateEnv(requiredEnvVars);

/**
 * Application configuration object
 * All config values are accessed through this object
 */
const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.DB_NAME || 'career-ai-saas',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  
  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // CORS - supports multiple origins separated by comma
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  
  // ML Service
  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  },
  
  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  // Logging
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Email configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp', // smtp, sendgrid, ses
    smtpHost: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpSecure: process.env.SMTP_SECURE || 'false',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    sesHost: process.env.SES_HOST || '',
    sesUser: process.env.SES_USER || '',
    sesPass: process.env.SES_PASS || '',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@careerai.com',
    fromName: process.env.EMAIL_FROM_NAME || 'CareerAI',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    proPriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    enterprisePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
  },

  // LLM configuration
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai', // openai, gemini
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
  },

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@careerai.com',
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || '',
  },
};

// Log configuration on startup (hide secrets)
if (config.env === 'development') {
  console.log('📋 Configuration loaded:', {
    ...config,
    jwt: { ...config.jwt, accessSecret: '***', refreshSecret: '***' },
  });
}

module.exports = config;
