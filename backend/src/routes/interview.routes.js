/**
 * Interview Routes
 * 
 * Endpoints:
 * - POST   /api/v1/interview/start      - Create new interview session
 * - GET    /api/v1/interview/:id        - Get interview session details
 * - GET    /api/v1/interview/history    - Get user's interview history
 * - POST   /api/v1/interview/:id/answer - Submit answer for current question
 * - POST   /api/v1/interview/:id/complete - Complete interview and get summary
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const {
    startInterview,
    getInterview,
    getInterviewHistory,
    submitAnswer,
    completeInterview,
} = require('../controllers/interview.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Interview session management
router.post('/start', startInterview);
router.get('/history', getInterviewHistory);
router.get('/:id', getInterview);
router.post('/:id/answer', submitAnswer);
router.post('/:id/complete', completeInterview);

module.exports = router;
