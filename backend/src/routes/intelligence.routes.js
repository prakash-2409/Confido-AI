const express = require('express');
const { protect } = require('../middlewares/auth');
const {
    analyzeAts,
    parseJd,
    diffResumes,
    getResumeHistory,
    getResumeVersion,
    getBenchmark,
    getConfidence,
    getSemanticMatch,
    getAtsReport
} = require('../controllers/intelligence.controller');

const router = express.Router();

// ATS Analysis
router.post('/ats/analyze', protect, analyzeAts);
router.get('/ats/report', protect, getAtsReport);

// Job Description Engine
router.post('/jd/parse', protect, parseJd);

// Diff Engine
router.post('/resume/diff', protect, diffResumes);

// Version and History
router.get('/resume/version/:id', protect, getResumeVersion);

// Benchmark, Confidence & Semantic overlays
router.get('/benchmark', protect, getBenchmark);
router.get('/confidence', protect, getConfidence);
router.get('/semantic-match', protect, getSemanticMatch);

module.exports = router;
