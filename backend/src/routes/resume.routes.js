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
const { mockAuth } = require('../middlewares/mockAuth');
const upload = require('../middlewares/upload');
const {
    uploadResume,
    getMyResumes,
    getResumeById,
    deleteResume,
} = require('../controllers/resume.controller');
const { analyzeResumeAgainstJob, getResumeSuggestions } = require('../controllers/analysis.controller');

const router = express.Router();

// Auth removed for testing - using mock user
router.use(mockAuth);

// Upload resume (file key must be 'resume')
router.post('/upload', upload.single('resume'), uploadResume);

// Analysis
router.post('/:id/analyze', analyzeResumeAgainstJob);

// AI Resume Suggestions
router.post('/suggestions', getResumeSuggestions);

// CRUD operations
router.get('/', getMyResumes);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

module.exports = router;
