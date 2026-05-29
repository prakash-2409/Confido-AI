/**
 * Database Configuration Module
 * 
 * Handles MongoDB connection using Mongoose with:
 * - Connection pooling for performance
 * - Automatic reconnection on failure
 * - Event logging for debugging
 * - Graceful disconnection
 */

const mongoose = require('mongoose');
const config = require('./env');

/**
 * Establishes connection to MongoDB
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(config.mongodb.uri, config.mongodb.options);

        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);

    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);

        if (config.env === 'development') {
            console.log('🔄 Development environment: Spinning up in-memory MongoDB server as fallback...');
            try {
                const { MongoMemoryServer } = require('mongodb-memory-server');
                const mongoServer = await MongoMemoryServer.create();
                const uri = mongoServer.getUri();
                console.log(`ℹ️ In-memory MongoDB Server URI: ${uri}`);
                await mongoose.connect(uri, config.mongodb.options);
                console.log('✅ MongoDB (In-Memory) connected successfully');
                global.__MONGO_MEMORY_SERVER__ = mongoServer;
                return;
            } catch (fallbackError) {
                console.error('❌ Failed to start in-memory MongoDB fallback:', fallbackError.message);
            }
        }

        console.error('💡 Make sure MongoDB is running and URI is correct');

        // Exit with failure code in production
        if (config.env === 'production') {
            process.exit(1);
        }

        throw error;
    }
};

/**
 * Gracefully closes database connection
 * @returns {Promise<void>}
 */
const disconnectDatabase = async () => {
    try {
        await mongoose.connection.close();
        console.log('👋 MongoDB connection closed gracefully');
        if (global.__MONGO_MEMORY_SERVER__) {
            await global.__MONGO_MEMORY_SERVER__.stop();
            console.log('👋 MongoDB In-Memory Server stopped');
        }
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error.message);
        throw error;
    }
};

/**
 * Checks if database is connected
 * @returns {boolean}
 */
const isDatabaseConnected = () => {
    return mongoose.connection.readyState === 1;
};

// Connection event handlers
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('⚠️  Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});

// Handle application termination
process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
});

module.exports = {
    connectDatabase,
    disconnectDatabase,
    isDatabaseConnected,
};
