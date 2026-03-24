/**
 * Express Application Configuration
 * 
 * Sets up the Express app with:
 * - Security middleware (helmet)
 * - CORS configuration
 * - Request parsing
 * - Request logging
 * - Route mounting
 * - Error handling
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const requestLogger = require('./middlewares/requestLogger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Import routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const interviewRoutes = require('./routes/interview.routes');
const adminRoutes = require('./routes/admin.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const growthRoutes = require('./routes/growth.routes');

// Initialize Express app
const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

// Cookie parser (must be before routes)
app.use(cookieParser());

// ============================================================
// RATE LIMITING
// ============================================================

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        error: { message: 'Too many requests, please try again later.', statusCode: 429 },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    message: {
        success: false,
        error: { message: 'Too many authentication attempts, please try again later.', statusCode: 429 },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// ============================================================
// REQUEST PARSING MIDDLEWARE
// ============================================================

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// LOGGING MIDDLEWARE
// ============================================================

// HTTP request logger
app.use(requestLogger);

// ============================================================
// ROUTES
// ============================================================

// API base path
const API_BASE = `/api/${config.apiVersion}`;

// Health check routes (public)
app.use('/health', healthRoutes);

// API routes
app.use(`${API_BASE}/auth`, authLimiter, authRoutes);
app.use(`${API_BASE}/resume`, resumeRoutes);
app.use(`${API_BASE}/interview`, interviewRoutes);
app.use(`${API_BASE}/admin`, adminRoutes);
app.use(`${API_BASE}/subscription`, subscriptionRoutes);
app.use(`${API_BASE}/growth`, growthRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Career AI SaaS API',
        version: config.apiVersion,
        environment: config.env,
        documentation: '/api/docs',
    });
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;
