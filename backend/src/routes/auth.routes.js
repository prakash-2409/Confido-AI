/**
 * Authentication Routes
 * 
 * Endpoints:
 * - POST /api/v1/auth/register - Register new user
 * - POST /api/v1/auth/login - Login user
 * - POST /api/v1/auth/refresh - Refresh access token
 * - POST /api/v1/auth/logout - Logout user
 * - GET /api/v1/auth/me - Get current user (protected)
 * - PUT /api/v1/auth/profile - Update profile (protected)
 */

const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { protect } = require('../middlewares/auth');
const {
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
} = require('../controllers/auth.controller');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    validate,
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate,
];

const refreshTokenValidation = [
    // refreshToken can come from cookie, so body validation is optional
    validate,
];

const profileUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('currentRole')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Current role cannot exceed 100 characters'),
    body('targetRole')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Target role cannot exceed 100 characters'),
    body('experienceYears')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience years must be between 0 and 50'),
    validate,
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshTokenValidation, refreshAccessToken);
router.post('/logout', logout);
router.get('/csrf', getCsrfToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail); // Works with token (public) or code (auth)

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, profileUpdateValidation, updateProfile);
router.post('/resend-verification', protect, resendVerification);

module.exports = router;
