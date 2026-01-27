/**
 * Authentication Middleware
 * 
 * Protects routes by verifying JWT access tokens
 * Attaches user object to request for use in controllers
 */

const { verifyAccessToken } = require('../utils/jwt');
const { ApiError } = require('./errorHandler');
const User = require('../models/User');

/**
 * Middleware to protect routes
 * Verifies JWT token and attaches user to request
 */
const protect = async (req, res, next) => {
    try {
        // 1. Get token from Authorization header
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        // 2. Check if token exists
        if (!token) {
            throw new ApiError(401, 'Not authorized, no token provided');
        }

        // 3. Verify token
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            throw new ApiError(401, error.message);
        }

        // 4. Find user by ID from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            throw new ApiError(401, 'User not found or has been deleted');
        }

        // 5. Check if user is active
        if (!user.isActive) {
            throw new ApiError(403, 'Account has been deactivated');
        }

        // 6. Attach user to request object
        req.user = user;
        req.userId = user._id.toString();

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to optionally attach user if token is present
 * Does not throw error if token is missing
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = verifyAccessToken(token);
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.isActive) {
                req.user = user;
                req.userId = user._id.toString();
            }
        }

        next();
    } catch (error) {
        // Ignore token errors for optional auth
        next();
    }
};

/**
 * Middleware to check if user has specific role
 * (Can be extended when role-based access control is needed)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Not authorized');
        }

        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `User role '${req.user.role}' is not authorized to access this route`
            );
        }

        next();
    };
};

module.exports = {
    protect,
    optionalAuth,
    authorize,
};
