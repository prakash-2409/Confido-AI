/**
 * Career Coach Routes
 * 
 * Endpoints:
 * - GET /api/v1/coach/history - Fetch previous conversation messages
 * - POST /api/v1/coach/message - Send new message or trigger special actions
 * - POST /api/v1/coach/clear - Clear user's chat history
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const coachController = require('../controllers/coach.controller');

const router = express.Router();

// Apply auth protection middleware to all coach endpoints
router.use(protect);

router.get('/history', coachController.getHistory);
router.post('/message', coachController.sendMessage);
router.post('/clear', coachController.clearHistory);

module.exports = router;
