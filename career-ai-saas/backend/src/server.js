/**
 * Server Entry Point
 * 
 * Responsibilities:
 * - Initialize database connection
 * - Start Express server
 * - Handle graceful shutdown
 * - Error handling for startup failures
 */

const app = require('./app');
const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');

// Store server instance for graceful shutdown
let server;

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // ============================================================
        // STEP 1: Connect to Database
        // ============================================================
        console.log('🚀 Starting Career AI SaaS Backend...\n');

        await connectDatabase();
        console.log('');

        // ============================================================
        // STEP 2: Start Express Server
        // ============================================================
        server = app.listen(config.port, () => {
            console.log('╔════════════════════════════════════════════════════╗');
            console.log('║                                                    ║');
            console.log(`║  ✅  Server running on port ${config.port}                  ║`);
            console.log(`║  🌍  Environment: ${config.env.padEnd(10)}                    ║`);
            console.log(`║  📡  API Base: /api/${config.apiVersion}                        ║`);
            console.log('║                                                    ║');
            console.log('╚════════════════════════════════════════════════════╝');
            console.log('');
            console.log(`📋 Health Check: http://localhost:${config.port}/health`);
            console.log(`📊 Database Health: http://localhost:${config.port}/health/db`);
            console.log(`🏠 API Root: http://localhost:${config.port}/`);
            console.log('');
            console.log('Press Ctrl+C to stop the server\n');
        });

        // ============================================================
        // STEP 3: Setup Error Handlers
        // ============================================================

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('⚠️  Unhandled Rejection at:', promise);
            console.error('⚠️  Reason:', reason);

            // In production, shut down gracefully
            if (config.env === 'production') {
                gracefulShutdown();
            }
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);

            // Always exit on uncaught exception
            gracefulShutdown();
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async () => {
    console.log('\n');
    console.log('⏳ Received shutdown signal, closing server gracefully...');

    // Stop accepting new connections
    if (server) {
        server.close(async () => {
            console.log('✅ HTTP server closed');

            // Close database connection
            try {
                await disconnectDatabase();
                console.log('✅ Database connection closed');
                console.log('👋 Server shutdown complete');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error.message);
                process.exit(1);
            }
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('⚠️  Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ============================================================
// START THE SERVER
// ============================================================

startServer();
