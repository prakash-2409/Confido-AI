/**
 * Dashboard Routes
 * 
 * Endpoints:
 * - GET /api/v1/dashboard/metrics - Central aggregated stats, timeline and recommendations
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const { getDashboardMetrics } = require('../controllers/dashboard.controller');

const router = express.Router();

// Apply auth protection
router.use(protect);

router.get('/metrics', getDashboardMetrics);

module.exports = router;
