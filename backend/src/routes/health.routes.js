/**
 * Health Check Routes
 * 
 * Endpoints:
 * - GET /health - Basic service health
 * - GET /health/db - Database connectivity check
 */

const express = require('express');
const { getHealth, getDatabaseHealth } = require('../controllers/health.controller');

const router = express.Router();

// Basic health check
router.get('/', getHealth);

// Database health check
router.get('/db', getDatabaseHealth);

module.exports = router;
