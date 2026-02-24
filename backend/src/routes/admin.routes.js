/**
 * Admin Routes
 * 
 * All routes require authentication + admin role.
 */

const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
    getDashboardStats,
    getUsers,
    getAnalytics,
    toggleUserStatus,
} = require('../controllers/admin.controller');

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
