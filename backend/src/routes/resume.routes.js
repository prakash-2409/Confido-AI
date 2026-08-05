/**
 * Resume Routes
 * 
 * Endpoints:
 * - POST /api/v1/resume/upload - Upload and parse resume
 * - GET /api/v1/resume - List my resumes
 * - GET /api/v1/resume/:id - Get resume details
 * - DELETE /api/v1/resume/:id - Delete resume
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
    uploadResume,
    getMyResumes,
    getResumeById,
    deleteResume,
    parseResumePipeline,
    getPlacementReadinessScore,
    getSkillGaps,
    getRecommendations,
    getEvidenceList,
    getGithubAnalysis,
    getReadinessHistory
} = require('../controllers/resume.controller');
const { getResumeHistory } = require('../controllers/intelligence.controller');
const { analyzeResumeAgainstJob, getResumeSuggestions } = require('../controllers/analysis.controller');

const router = express.Router();

// Apply real authentication middleware
router.use(protect);

// Upload resume (file key must be 'resume')
router.post('/upload', upload.single('resume'), uploadResume);

// Analysis pipeline trigger
router.post('/parse', parseResumePipeline);

// Placement Readiness queries
router.get('/placement-score/:candidateId', getPlacementReadinessScore);
router.get('/skill-gap/:candidateId', getSkillGaps);
router.get('/recommendations/:candidateId', getRecommendations);
router.get('/evidence/:candidateId', getEvidenceList);
router.get('/github-analysis/:candidateId', getGithubAnalysis);
router.get('/history/:candidateId', getReadinessHistory);

// Analysis
router.post('/:id/analyze', analyzeResumeAgainstJob);

// AI Resume Suggestions
router.post('/suggestions', getResumeSuggestions);

// CRUD operations
router.get('/history', getResumeHistory);
router.get('/', getMyResumes);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

module.exports = router;
