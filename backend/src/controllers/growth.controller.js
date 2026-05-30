/**
 * Growth Features Controller (P3 - Future Features)
 * 
 * Placeholder endpoints for:
 * - Video Interview + Speech Analysis
 * - AI Voice Confidence Scoring
 * - Personalized Learning Roadmap
 * - Company-Specific Mock Interviews
 * 
 * These are scaffold implementations that return proper responses
 * but indicate the feature is coming soon.
 */

const VideoInterview = require('../models/VideoInterview');
const LearningRoadmap = require('../models/LearningRoadmap');
const CompanyInterview = require('../models/CompanyInterview');
const User = require('../models/User');
const { ApiError } = require('../middlewares/errorHandler');
const { updateCareerReadiness } = require('../services/readinessEngine');
const logger = require('../config/logger');

// ============================================================
// Video Interview + Speech Analysis
// ============================================================

/**
 * Get user's video interviews
 * GET /api/v1/growth/video-interviews
 */
const getVideoInterviews = async (req, res, next) => {
    try {
        const interviews = await VideoInterview.find({ user: req.userId })
            .select('-speechAnalysis.transcript')
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            data: { interviews },
            meta: { feature: 'video_interview', status: 'beta' },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a video interview session
 * POST /api/v1/growth/video-interviews
 */
const createVideoInterview = async (req, res, next) => {
    try {
        const { title, targetRole, company } = req.body;

        if (!title || !targetRole) {
            throw new ApiError(400, 'Title and target role are required');
        }

        const interview = await VideoInterview.create({
            user: req.userId,
            title,
            targetRole,
            company: company || null,
            status: 'scheduled',
        });

        logger.info('Video interview created', { userId: req.userId, interviewId: interview._id });

        res.status(201).json({
            success: true,
            data: { interview },
            message: 'Video interview session created. Recording feature coming soon!',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get video interview details with analysis
 * GET /api/v1/growth/video-interviews/:id
 */
const getVideoInterviewById = async (req, res, next) => {
    try {
        const interview = await VideoInterview.findOne({
            _id: req.params.id,
            user: req.userId,
        });

        if (!interview) {
            throw new ApiError(404, 'Video interview not found');
        }

        res.status(200).json({
            success: true,
            data: { interview },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Personalized Learning Roadmap
// ============================================================

/**
 * Get user's learning roadmaps
 * GET /api/v1/growth/roadmaps
 */
const getRoadmaps = async (req, res, next) => {
    try {
        const roadmaps = await LearningRoadmap.find({ user: req.userId })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: { roadmaps },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate a new learning roadmap
 * POST /api/v1/growth/roadmaps
 */
const createRoadmap = async (req, res, next) => {
    try {
        const { targetRole, currentLevel } = req.body;

        if (!targetRole) {
            throw new ApiError(400, 'Target role is required');
        }

        // Fetch user's missing skills from ATS analysis
        const user = await User.findById(req.userId);
        const missingSkills = user ? user.missingSkills || [] : [];

        const milestones = [];
        let order = 1;

        // Core assessment milestone
        milestones.push({
            title: 'Core Skills Assessment',
            description: `Evaluate your current skill level and identify gaps for the target role: ${targetRole}`,
            category: 'technical',
            priority: 'critical',
            status: 'not_started',
            estimatedHours: 2,
            order: order++,
        });

        // Add dynamic milestones for missing skills
        if (missingSkills.length > 0) {
            missingSkills.forEach(skill => {
                milestones.push({
                    title: `Master ${skill.skillName}`,
                    description: `Learn and practice ${skill.skillName} to close the skill gap identified in your resume. Why recommended: This was identified as a ${skill.importance} missing skill required for the ${targetRole} role.`,
                    category: 'technical',
                    priority: skill.importance === 'critical' ? 'critical' : 'important',
                    status: 'not_started',
                    estimatedHours: skill.importance === 'critical' ? 15 : 8,
                    skills: [skill.skillName],
                    order: order++,
                    resources: [
                        {
                            title: `${skill.skillName} Documentation`,
                            url: `https://www.google.com/search?q=${encodeURIComponent(skill.skillName + ' official documentation')}`,
                            type: 'article',
                            free: true
                        },
                        {
                            title: `Learn ${skill.skillName} on YouTube`,
                            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill.skillName + ' tutorial')}`,
                            type: 'video',
                            free: true
                        }
                    ]
                });
            });
        } else {
            // Default generic fallback milestone if user has no resume/missing skills
            milestones.push({
                title: `Learn Core technologies for ${targetRole}`,
                description: `Acquire key skills commonly required for a ${targetRole}. Why recommended: Essential technical foundation for this career track.`,
                category: 'technical',
                priority: 'important',
                status: 'not_started',
                estimatedHours: 12,
                order: order++,
            });
        }

        // Add final wrap up milestone
        milestones.push({
            title: 'Resume Optimization & Mock Interview',
            description: `Tailor your resume for the ${targetRole} role and conduct a practice interview session to test your knowledge.`,
            category: 'soft_skills',
            priority: 'important',
            status: 'not_started',
            estimatedHours: 6,
            order: order++,
        });

        const roadmap = await LearningRoadmap.create({
            user: req.userId,
            title: `Roadmap to ${targetRole}`,
            targetRole,
            currentLevel: currentLevel || 'intermediate',
            status: 'active',
            milestones,
            estimatedTotalHours: milestones.reduce((sum, m) => sum + (m.estimatedHours || 0), 0),
            aiInsights: {
                summary: `Personalized roadmap to become a ${targetRole} based on your resume gaps.`,
                keyFocus: missingSkills.map(s => s.skillName).slice(0, 3).concat(['Interview Prep', 'Resume Optimization']),
                estimatedTimeToReady: missingSkills.length > 2 ? '4-6 weeks' : '2-3 weeks',
            },
        });

        logger.info('Learning roadmap created', { userId: req.userId, roadmapId: roadmap._id });

        // Update Career Readiness score
        await updateCareerReadiness(req.userId);

        res.status(201).json({
            success: true,
            data: { roadmap },
            message: 'Learning roadmap created successfully!',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update milestone status
 * PUT /api/v1/growth/roadmaps/:id/milestones/:milestoneId
 */
const updateMilestoneStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const roadmap = await LearningRoadmap.findOne({
            _id: req.params.id,
            user: req.userId,
        });

        if (!roadmap) {
            throw new ApiError(404, 'Roadmap not found');
        }

        const milestone = roadmap.milestones.id(req.params.milestoneId);
        if (!milestone) {
            throw new ApiError(404, 'Milestone not found');
        }

        milestone.status = status;
        if (status === 'completed') {
            milestone.completedAt = new Date();
        }
        roadmap.updateCompletion();
        await roadmap.save();

        // Update Career Readiness score
        await updateCareerReadiness(req.userId);

        res.status(200).json({
            success: true,
            data: { roadmap },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Company-Specific Mock Interviews
// ============================================================

/**
 * Get available companies
 * GET /api/v1/growth/companies
 */
const getCompanies = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = { company: { $regex: search, $options: 'i' } };
        }

        const companies = await CompanyInterview.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$company',
                    roles: { $addToSet: '$role' },
                    totalQuestions: { $sum: { $size: '$questions' } },
                    companyLogo: { $first: '$companyLogo' },
                },
            },
            { $sort: { totalQuestions: -1 } },
            { $limit: 50 },
        ]);

        res.status(200).json({
            success: true,
            data: { companies },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get company-specific interview questions
 * GET /api/v1/growth/companies/:company/interviews
 */
const getCompanyInterviews = async (req, res, next) => {
    try {
        const { company } = req.params;
        const { role } = req.query;

        let query = { company: { $regex: new RegExp(`^${company}$`, 'i') } };
        if (role) {
            query.role = { $regex: role, $options: 'i' };
        }

        const interviews = await CompanyInterview.find(query)
            .sort({ popularity: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            data: { interviews },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVideoInterviews,
    createVideoInterview,
    getVideoInterviewById,
    getRoadmaps,
    createRoadmap,
    updateMilestoneStatus,
    getCompanies,
    getCompanyInterviews,
};
