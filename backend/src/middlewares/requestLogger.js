/**
 * Request Logger Middleware
 * 
 * Uses Morgan for HTTP request logging with:
 * - Custom format for production
 * - Colored output for development
 * - Request timing
 * - Status code highlighting
 */

const morgan = require('morgan');
const config = require('../config/env');

/**
 * Custom Morgan token for request ID
 * (Can be extended with actual request ID generation)
 */
morgan.token('id', (req) => {
    return req.id || 'no-id';
});

/**
 * Custom Morgan format for production
 * Includes: timestamp, method, url, status, response-time, content-length
 */
const productionFormat = ':date[iso] :method :url :status :response-time ms - :res[content-length]';

/**
 * Development format with colors
 * Includes: method, url, status, response-time
 */
const developmentFormat = ':method :url :status :response-time ms';

/**
 * Configure Morgan based on environment
 */
const requestLogger = config.env === 'production'
    ? morgan(productionFormat)
    : morgan(developmentFormat);

/**
 * Skip logging for health check endpoints in production
 */
const skipHealthCheck = (req, res) => {
    return config.env === 'production' && req.path.startsWith('/health');
};

/**
 * Logger middleware with skip logic
 */
const logger = morgan(
    config.env === 'production' ? productionFormat : developmentFormat,
    {
        skip: skipHealthCheck,
    }
);

module.exports = logger;
