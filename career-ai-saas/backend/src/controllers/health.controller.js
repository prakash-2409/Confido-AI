/**
 * Health Check Controller
 * 
 * Provides endpoints to monitor service health:
 * - Basic health check (server status)
 * - Database health check (MongoDB connectivity)
 */

const { isDatabaseConnected } = require('../config/database');
const config = require('../config/env');

/**
 * Basic health check
 * GET /health
 * 
 * Returns:
 * - Service status
 * - Uptime
 * - Timestamp
 * - Environment
 */
const getHealth = (req, res) => {
    const healthData = {
        success: true,
        message: 'Career AI SaaS Backend is running',
        data: {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: config.env,
            version: '1.0.0',
        },
    };

    res.status(200).json(healthData);
};

/**
 * Database health check
 * GET /health/db
 * 
 * Returns:
 * - Database connection status
 * - Database name
 * - Response time
 */
const getDatabaseHealth = async (req, res) => {
    const startTime = Date.now();

    try {
        const isConnected = isDatabaseConnected();
        const responseTime = Date.now() - startTime;

        if (!isConnected) {
            return res.status(503).json({
                success: false,
                message: 'Database is not connected',
                data: {
                    status: 'unhealthy',
                    database: config.mongodb.dbName,
                    connected: false,
                    responseTime: `${responseTime}ms`,
                },
            });
        }

        res.status(200).json({
            success: true,
            message: 'Database is healthy',
            data: {
                status: 'healthy',
                database: config.mongodb.dbName,
                connected: true,
                responseTime: `${responseTime}ms`,
            },
        });
    } catch (error) {
        const responseTime = Date.now() - startTime;

        res.status(503).json({
            success: false,
            message: 'Database health check failed',
            data: {
                status: 'unhealthy',
                error: error.message,
                responseTime: `${responseTime}ms`,
            },
        });
    }
};

module.exports = {
    getHealth,
    getDatabaseHealth,
};
