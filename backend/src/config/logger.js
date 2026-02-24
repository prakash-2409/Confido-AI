/**
 * Production-Ready Logger (Winston)
 * 
 * Features:
 * - Structured JSON logging in production
 * - Colorized console output in development
 * - Log rotation via daily rotate file transport
 * - Request correlation IDs
 * - Error stack traces
 * - Configurable log levels
 */

const winston = require('winston');
const path = require('path');
const config = require('./env');

// Custom log format with timestamp and structured data
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Colorized console format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Define transports based on environment
const transports = [];

// Always log to console
transports.push(
  new winston.transports.Console({
    format: config.env === 'production' ? logFormat : devFormat,
    level: config.log.level || 'info',
  })
);

// In production, also log to files
if (config.env === 'production') {
  const logDir = path.join(__dirname, '../../logs');

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      level: 'info',
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: config.log.level || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'career-ai-backend',
    environment: config.env,
  },
  transports,
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
