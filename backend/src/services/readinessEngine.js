const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const LearningRoadmap = require('../models/LearningRoadmap');

/**
 * Recalculates and updates the Career Readiness score for a user
 * @param {string} userId - User Mongoose ID
 * @returns {Promise<Object>} Readiness metrics details
 */
const updateCareerReadiness = async (userId) => {
    // 1. Fetch user profile completeness
    const user = await User.findById(userId);
    if (!user) return null;

    const profileCompleteness = user.profileCompleteness || 0;

    // 2. Fetch latest analyzed resume score
    const latestResume = await Resume.findOne({ user: userId, status: 'analyzed' })
        .sort({ createdAt: -1 });
    const atsScore = latestResume && latestResume.atsScore ? latestResume.atsScore : 0;

    // 3. Fetch completed interviews average score
    const completedInterviews = await Interview.find({ user: userId, status: 'completed' });
    let interviewScore = 0;
    if (completedInterviews.length > 0) {
        const total = completedInterviews.reduce((acc, i) => acc + (i.summary?.overallScore || i.overallScore || 0), 0);
        interviewScore = Math.round(total / completedInterviews.length);
    }

    // 4. Fetch active learning roadmap progress
    const activeRoadmap = await LearningRoadmap.findOne({ user: userId, status: 'active' });
    const roadmapProgress = activeRoadmap ? activeRoadmap.completionPercentage || 0 : 0;

    // 5. Compute score based on weights
    // ATS: 30%, Interview: 30%, Roadmap: 20%, Profile: 20%
    const readiness = (atsScore * 0.3) + (interviewScore * 0.3) + (roadmapProgress * 0.2) + (profileCompleteness * 0.2);
    const finalScore = Math.min(100, Math.max(0, Math.round(readiness)));

    // 6. Update user model
    user.careerReadiness = finalScore;
    await user.save();

    return {
        careerReadiness: finalScore,
        breakdown: {
            atsScore,
            interviewScore,
            roadmapProgress,
            profileCompleteness,
        }
    };
};

module.exports = {
    updateCareerReadiness,
};
