/**
 * JWT Utility Functions
 * 
 * Handles JWT token generation and verification for:
 * - Access tokens (short-lived, 15min)
 * - Refresh tokens (long-lived, 7 days)
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate access token
 * @param {Object} payload - User data to encode (id, email)
 * @returns {string} - JWT access token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        config.jwt.accessSecret,
        {
            expiresIn: config.jwt.accessExpiresIn, // 15 minutes
            issuer: 'career-ai-saas',
            audience: 'career-ai-users',
        }
    );
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode (id, email)
 * @returns {string} - JWT refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        config.jwt.refreshSecret,
        {
            expiresIn: config.jwt.refreshExpiresIn, // 7 days
            issuer: 'career-ai-saas',
            audience: 'career-ai-users',
        }
    );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object from database
 * @returns {Object} - { accessToken, refreshToken }
 */
const generateTokenPair = (user) => {
    const payload = {
        id: user._id.toString(),
        email: user.email,
    };

    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} - Decoded payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.accessSecret, {
            issuer: 'career-ai-saas',
            audience: 'career-ai-users',
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Access token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid access token');
        }
        throw error;
    }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} - Decoded payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.refreshSecret, {
            issuer: 'career-ai-saas',
            audience: 'career-ai-users',
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid refresh token');
        }
        throw error;
    }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

/**
 * Get token expiry time in milliseconds
 * @param {string} expiresIn - Time string (e.g., '15m', '7d')
 * @returns {number} - Expiry time in milliseconds
 */
const getExpiryTime = (expiresIn) => {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        default:
            throw new Error('Invalid time unit');
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    getExpiryTime,
};
