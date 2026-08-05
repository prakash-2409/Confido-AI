/**
 * Recruiter Feature Routes
 * 
 * Endpoints:
 * - GET /api/v1/recruiter/candidates - List candidates with search/filters
 * - GET /api/v1/recruiter/candidates/:id - View single candidate details
 * - POST /api/v1/recruiter/candidates - Add a candidate
 * - POST /api/v1/recruiter/candidates/:id/notes - Add notes to a candidate
 * - GET /api/v1/recruiter/workspace - Fetch Kanban pipeline stages and recent notes
 * - GET /api/v1/recruiter/placement - Fetch placements batch stats and employers
 * - GET /api/v1/recruiter/analytics - Fetch hiring analytics and metrics
 * - GET /api/v1/recruiter/evidence - Fetch evidence summary & dynamic coverage
 * - POST /api/v1/recruiter/copilot - Ask questions to Recruiter AI Copilot
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const {
    getCandidates,
    getCandidateById,
    createCandidate,
    addCandidateNote,
    getWorkspacePipeline,
    getPlacementStats,
    getHiringAnalytics,
    getEvidenceSummary,
    queryCopilot
} = require('../controllers/recruiter.controller');

const router = express.Router();

// Apply authorization check - protect routes
router.use(protect);

router.get('/candidates', getCandidates);
router.get('/candidates/:id', getCandidateById);
router.post('/candidates', createCandidate);
router.post('/candidates/:id/notes', addCandidateNote);

router.get('/workspace', getWorkspacePipeline);
router.get('/placement', getPlacementStats);
router.get('/analytics', getHiringAnalytics);
router.get('/evidence', getEvidenceSummary);
router.post('/copilot', queryCopilot);

module.exports = router;
