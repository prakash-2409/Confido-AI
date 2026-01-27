/**
 * Interview Routes
 * 
 * Endpoints:
 * - POST /api/v1/interview/start
 * - POST /api/v1/interview/:id/answer
 * - POST /api/v1/interview/:id/end
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const {
    startInterview,
    submitAnswer,
    endInterview,
} = require('../controllers/interview.controller');

const router = express.Router();

router.use(protect);

router.post('/start', startInterview);
router.post('/:id/answer', submitAnswer);
router.post('/:id/end', endInterview);

module.exports = router;
