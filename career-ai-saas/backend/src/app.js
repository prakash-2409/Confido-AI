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
const config = require('./config/env');
const requestLogger = require('./middlewares/requestLogger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Import routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const interviewRoutes = require('./routes/interview.routes');

// Initialize Express app
const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

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
app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/resume`, resumeRoutes);
app.use(`${API_BASE}/interview`, interviewRoutes);
// app.use(`${API_BASE}/analytics`, analyticsRoutes);

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
