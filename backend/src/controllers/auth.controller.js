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

const crypto = require('crypto');
const User = require('../models/User');
const { ApiError } = require('../middlewares/errorHandler');
const {
    generateTokenPair,
    verifyRefreshToken,
    getExpiryTime,
} = require('../utils/jwt');
const config = require('../config/env');
const logger = require('../config/logger');
const {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    generateVerificationCode,
    generateSecureToken,
    hashToken,
} = require('../services/emailService');

// ============================================================
// COOKIE HELPERS
// ============================================================

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'strict' : 'lax',
    path: '/',
};

/**
 * Set access and refresh token cookies on the response
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: getExpiryTime(config.jwt.accessExpiresIn),
    });
    res.cookie('refreshToken', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: getExpiryTime(config.jwt.refreshExpiresIn),
    });
};

/**
 * Clear auth cookies
 */
const clearTokenCookies = (res) => {
    res.cookie('accessToken', '', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.cookie('refreshToken', '', { ...COOKIE_OPTIONS, maxAge: 0 });
};

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

        // 4. Generate and store email verification code/token
        const verificationCode = generateVerificationCode();
        const verificationToken = generateSecureToken();
        user.emailVerificationCode = hashToken(verificationCode);
        user.emailVerificationToken = hashToken(verificationToken);
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 5. Generate tokens
        const { accessToken, refreshToken } = generateTokenPair(user);

        // 6. Store refresh token in database
        const refreshExpiryMs = getExpiryTime(config.jwt.refreshExpiresIn);
        user.addRefreshToken(refreshToken, refreshExpiryMs);
        await user.save();

        // 7. Send verification email (non-blocking)
        sendVerificationEmail(user, verificationCode, verificationToken).catch(err => {
            logger.error('Failed to send verification email', { userId: user._id, error: err.message });
        });

        // 8. Set HttpOnly cookies
        setTokenCookies(res, accessToken, refreshToken);

        // 9. Send response (no tokens in body - they're in cookies)
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

        // 7. Set HttpOnly cookies
        setTokenCookies(res, accessToken, refreshToken);

        // 8. Send response (exclude password, no tokens in body)
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
        // Read refresh token from cookie or body
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

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

        // 8. Set new cookies
        setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

        // 9. Send response
        res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
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
        // Read refresh token from cookie or body
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

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

        // Clear auth cookies
        clearTokenCookies(res);

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

/**
 * Get CSRF token
 * GET /api/v1/auth/csrf
 */
const getCsrfToken = (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    res.status(200).json({
        success: true,
        data: { token },
    });
};

/**
 * Forgot password
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new ApiError(400, 'Email is required');
        }

        // Find user by email
        const user = await User.findByEmail(email);

        // Always return success for security (don't reveal if email exists)
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }

        // Generate reset code and token
        const resetCode = generateVerificationCode();
        const resetToken = generateSecureToken();

        // Store hashed versions in DB
        user.passwordResetCode = hashToken(resetCode);
        user.passwordResetToken = hashToken(resetToken);
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        // Send password reset email
        await sendPasswordResetEmail(user, resetCode, resetToken);

        logger.info('Password reset requested', { userId: user._id, email: user.email });

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password with code or token
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token, code, email, password } = req.body;

        if (!password || password.length < 6) {
            throw new ApiError(400, 'New password must be at least 6 characters');
        }

        if (!token && !code) {
            throw new ApiError(400, 'Reset token or code is required');
        }

        // Build query to find the user
        let query = {};
        if (token) {
            query.passwordResetToken = hashToken(token);
        } else if (code && email) {
            query.passwordResetCode = hashToken(code);
            query.email = email.toLowerCase();
        } else {
            throw new ApiError(400, 'Email is required when using reset code');
        }

        // Find user with valid, non-expired reset token
        const user = await User.findOne({
            ...query,
            passwordResetExpires: { $gt: new Date() },
        }).select('+passwordResetCode +passwordResetToken +passwordResetExpires');

        if (!user) {
            throw new ApiError(400, 'Invalid or expired reset token');
        }

        // Update password
        user.password = password;
        user.passwordResetCode = undefined;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        // Invalidate all existing refresh tokens (force re-login everywhere)
        user.refreshTokens = [];
        await user.save();

        logger.info('Password reset successful', { userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. Please log in with your new password.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify email with code or token
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
    try {
        const { code, token } = req.body;

        if (!code && !token) {
            throw new ApiError(400, 'Verification code or token is required');
        }

        // Build query
        let query = {};
        if (token) {
            query.emailVerificationToken = hashToken(token);
        } else if (code) {
            // Need user context from auth middleware
            if (!req.userId) {
                throw new ApiError(401, 'Please log in to verify your email');
            }
            query._id = req.userId;
            query.emailVerificationCode = hashToken(code);
        }

        const user = await User.findOne({
            ...query,
            emailVerificationExpires: { $gt: new Date() },
        }).select('+emailVerificationCode +emailVerificationToken +emailVerificationExpires');

        if (!user) {
            throw new ApiError(400, 'Invalid or expired verification code');
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        
        // Update profile completeness
        if (user.profileCompleteness < 50) {
            user.profileCompleteness = 50;
        }
        
        await user.save();

        // Send welcome email
        sendWelcomeEmail(user).catch(err => {
            logger.error('Failed to send welcome email', { userId: user._id, error: err.message });
        });

        logger.info('Email verified', { userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Email verified successfully!',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isEmailVerified: true,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
const resendVerification = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        if (user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: 'Email is already verified',
            });
        }

        // Generate new code and token
        const verificationCode = generateVerificationCode();
        const verificationToken = generateSecureToken();
        user.emailVerificationCode = hashToken(verificationCode);
        user.emailVerificationToken = hashToken(verificationToken);
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        // Send email
        await sendVerificationEmail(user, verificationCode, verificationToken);

        logger.info('Verification email resent', { userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully',
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
    getCsrfToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
};
