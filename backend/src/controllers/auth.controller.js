/**
 * Authentication Controller
 * 
 * Handles user authentication operations:
 * - Register new users
 * - Login existing users
 * - Refresh access tokens
 * - Logout users
 * - Get current user profile
 */

const User = require('../models/User');
const { ApiError } = require('../middlewares/errorHandler');
const {
    generateTokenPair,
    verifyRefreshToken,
    getExpiryTime,
} = require('../utils/jwt');
const config = require('../config/env');

/**
 * Register a new user
 * POST /api/v1/auth/register
 * 
 * @body {string} email - User email
 * @body {string} password - User password
 * @body {string} name - User full name
 */
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // 1. Validate input
        if (!email || !password || !name) {
            throw new ApiError(400, 'Please provide email, password, and name');
        }

        // 2. Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            throw new ApiError(409, 'Email already registered');
        }

        // 3. Create new user (password will be hashed by pre-save middleware)
        const user = await User.create({
            email,
            password,
            name,
        });

        // 4. Generate tokens
        const { accessToken, refreshToken } = generateTokenPair(user);

        // 5. Store refresh token in database
        const refreshExpiryMs = getExpiryTime(config.jwt.refreshExpiresIn);
        user.addRefreshToken(refreshToken, refreshExpiryMs);
        await user.save();

        // 6. Send response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    profileCompleteness: user.profileCompleteness,
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: config.jwt.accessExpiresIn,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login existing user
 * POST /api/v1/auth/login
 * 
 * @body {string} email - User email
 * @body {string} password - User password
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            throw new ApiError(400, 'Please provide email and password');
        }

        // 2. Find user and include password field
        const user = await User.findByEmail(email).select('+password');

        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }

        // 3. Check if account is active
        if (!user.isActive) {
            throw new ApiError(403, 'Account has been deactivated');
        }

        // 4. Verify password
        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            throw new ApiError(401, 'Invalid email or password');
        }

        // 5. Generate tokens
        const { accessToken, refreshToken } = generateTokenPair(user);

        // 6. Store refresh token and update last login
        const refreshExpiryMs = getExpiryTime(config.jwt.refreshExpiresIn);
        user.addRefreshToken(refreshToken, refreshExpiryMs);
        user.lastLogin = new Date();
        await user.save();

        // 7. Send response (exclude password)
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    currentRole: user.currentRole,
                    targetRole: user.targetRole,
                    profileCompleteness: user.profileCompleteness,
                    hasUploadedResume: user.hasUploadedResume,
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: config.jwt.accessExpiresIn,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 * 
 * @body {string} refreshToken - Valid refresh token
 */
const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        // 1. Validate input
        if (!refreshToken) {
            throw new ApiError(400, 'Refresh token is required');
        }

        // 2. Verify refresh token
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new ApiError(401, error.message);
        }

        // 3. Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new ApiError(401, 'User not found');
        }

        // 4. Check if refresh token exists in database
        const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);

        if (!tokenExists) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        // 5. Remove expired tokens
        user.removeExpiredTokens();

        // 6. Generate new token pair
        const tokens = generateTokenPair(user);

        // 7. Replace old refresh token with new one
        user.removeRefreshToken(refreshToken);
        const refreshExpiryMs = getExpiryTime(config.jwt.refreshExpiresIn);
        user.addRefreshToken(tokens.refreshToken, refreshExpiryMs);
        await user.save();

        // 8. Send response
        res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: {
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: config.jwt.accessExpiresIn,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 * 
 * @body {string} refreshToken - Refresh token to invalidate
 */
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new ApiError(400, 'Refresh token is required');
        }

        // Verify token and get user ID
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            // Even if token is expired, try to remove it
            decoded = null;
        }

        if (decoded) {
            const user = await User.findById(decoded.id);

            if (user) {
                user.removeRefreshToken(refreshToken);
                await user.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 * 
 * Requires authentication
 */
const getCurrentUser = async (req, res, next) => {
    try {
        // user is attached by auth middleware
        const user = req.user;

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    currentRole: user.currentRole,
                    targetRole: user.targetRole,
                    experienceYears: user.experienceYears,
                    profileCompleteness: user.profileCompleteness,
                    hasUploadedResume: user.hasUploadedResume,
                    isEmailVerified: user.isEmailVerified,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * PUT /api/v1/auth/profile
 * 
 * Requires authentication
 */
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.userId;
        const allowedUpdates = ['name', 'phone', 'currentRole', 'targetRole', 'experienceYears'];

        // Filter only allowed fields
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            throw new ApiError(400, 'No valid fields to update');
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    currentRole: user.currentRole,
                    targetRole: user.targetRole,
                    experienceYears: user.experienceYears,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshAccessToken,
    logout,
    getCurrentUser,
    updateProfile,
};
