/**
 * Growth Features Routes (P3 - Future Features)
 * 
 * All routes require authentication.
 * These are scaffold routes for P3 growth features.
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const {
    getVideoInterviews,
    createVideoInterview,
    getVideoInterviewById,
    getRoadmaps,
    createRoadmap,
    updateMilestoneStatus,
    getCompanies,
    getCompanyInterviews,
} = require('../controllers/growth.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ---- Video Interviews ----
router.get('/video-interviews', getVideoInterviews);
router.post('/video-interviews', createVideoInterview);
router.get('/video-interviews/:id', getVideoInterviewById);

// ---- Learning Roadmaps ----
router.get('/roadmaps', getRoadmaps);
router.post('/roadmaps', createRoadmap);
router.put('/roadmaps/:id/milestones/:milestoneId', updateMilestoneStatus);

// ---- Company-Specific Interviews ----
router.get('/companies', getCompanies);
router.get('/companies/:company/interviews', getCompanyInterviews);

module.exports = router;
