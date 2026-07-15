/**
 * Job Match Routes
 * 
 * Endpoints:
 * - POST /api/v1/job-match/analyze     - Run full job match analysis (text or PDF)
 * - GET  /api/v1/job-match             - List all user's analyses
 * - GET  /api/v1/job-match/:id         - Get single analysis details
 * - DELETE /api/v1/job-match/:id       - Delete an analysis
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
    analyzeJobMatch,
    getMyMatches,
    getMatchById,
    deleteMatch,
} = require('../controllers/jobMatch.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Analyze with optional PDF upload (field name: 'jobDescriptionFile')
router.post('/analyze', upload.single('jobDescriptionFile'), analyzeJobMatch);

// CRUD operations
router.get('/', getMyMatches);
router.get('/:id', getMatchById);
router.delete('/:id', deleteMatch);

module.exports = router;
