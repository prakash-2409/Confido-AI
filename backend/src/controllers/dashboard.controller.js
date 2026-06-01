const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const LearningRoadmap = require('../models/LearningRoadmap');
const { updateCareerReadiness } = require('../services/readinessEngine');

/**
 * Get unified dashboard metrics, recommendations, and career timeline
 * GET /api/v1/dashboard/metrics
 */
const getDashboardMetrics = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // 1. Trigger readiness update to ensure accurate database values
        const readinessData = await updateCareerReadiness(userId);
        const careerReadiness = readinessData ? readinessData.careerReadiness : 0;
        const breakdown = readinessData ? readinessData.breakdown : {
            atsScore: 0,
            interviewScore: 0,
            roadmapProgress: 0,
            profileCompleteness: 30,
        };

        // 2. Fetch detailed documents
        const latestResume = await Resume.findOne({ user: userId, status: 'analyzed' })
            .sort({ createdAt: -1 });

        const activeRoadmap = await LearningRoadmap.findOne({ user: userId, status: 'active' });

        const completedInterviews = await Interview.find({ user: userId, status: 'completed' })
            .sort({ completedAt: -1 });

        const allResumes = await Resume.find({ user: userId }).sort({ createdAt: -1 });
        const allInterviews = await Interview.find({ user: userId }).sort({ createdAt: -1 });

        // 3. Generate Top 3 Actionable Recommendations
        const recommendations = [];

        // Recommendation 1: Resume Upload
        if (allResumes.length === 0) {
            recommendations.push({
                id: 'rec-upload-resume',
                type: 'resume',
                title: 'Upload your Resume',
                description: 'Upload your resume to get your ATS compatibility score and scan for missing skills.',
                actionLink: '/dashboard/resume',
                priority: 'high',
            });
        } else if (!latestResume) {
            recommendations.push({
                id: 'rec-analyze-resume',
                type: 'resume',
                title: 'Analyze your Resume',
                description: 'Run an ATS check on your uploaded resume against a target job description.',
                actionLink: '/dashboard/resume',
                priority: 'high',
            });
        }

        // Recommendation 2: Roadmap Generation & Progression
        if (!activeRoadmap) {
            recommendations.push({
                id: 'rec-create-roadmap',
                type: 'roadmap',
                title: 'Generate a Learning Roadmap',
                description: 'Generate an AI-powered roadmap to learn missing skills and prepare for your target career.',
                actionLink: '/dashboard/roadmap',
                priority: 'medium',
            });
        } else {
            const nextMilestone = activeRoadmap.milestones.find(m => m.status === 'not_started' || m.status === 'in_progress');
            if (nextMilestone) {
                recommendations.push({
                    id: `rec-roadmap-milestone-${nextMilestone._id}`,
                    type: 'roadmap',
                    title: `Complete Milestone: ${nextMilestone.title}`,
                    description: nextMilestone.description || 'Learn this recommended skill.',
                    actionLink: '/dashboard/roadmap',
                    priority: nextMilestone.priority === 'critical' ? 'high' : 'medium',
                });
            }
        }

        // Recommendation 3: Interview Practice
        if (completedInterviews.length === 0) {
            recommendations.push({
                id: 'rec-start-interview',
                type: 'interview',
                title: 'Practice a Mock Interview',
                description: 'Start a mock interview session targeting missing skills and roles to test your readiness.',
                actionLink: '/dashboard/interview',
                priority: 'high',
            });
        } else {
            const latestScore = completedInterviews[0].summary?.overallScore || 0;
            if (latestScore < 70) {
                recommendations.push({
                    id: 'rec-improve-interview',
                    type: 'interview',
                    title: 'Retake Mock Interview',
                    description: `Your last score was ${latestScore}%. Retake the mock interview to practice missing questions.`,
                    actionLink: '/dashboard/interview',
                    priority: 'medium',
                });
            }
        }

        // Recommendation 4: Complete Profile details
        if (breakdown.profileCompleteness < 70) {
            recommendations.push({
                id: 'rec-complete-profile',
                type: 'profile',
                title: 'Complete Your Career Profile',
                description: 'Fill in your target role and experience details in your profile settings.',
                actionLink: '/dashboard/profile',
                priority: 'low',
            });
        }

        // Keep top 3 sorted by priority
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        const topRecommendations = recommendations
            .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
            .slice(0, 3);

        // 4. Generate Timeline Events
        const timeline = [];

        // Add resume events
        allResumes.forEach(r => {
            timeline.push({
                id: `event-res-up-${r._id}`,
                type: 'resume',
                title: 'Resume Uploaded',
                description: `Uploaded "${r.originalName}"`,
                timestamp: r.createdAt,
            });
            if (r.status === 'analyzed') {
                timeline.push({
                    id: `event-res-an-${r._id}`,
                    type: 'achievement',
                    title: 'Resume ATS Analysis Completed',
                    description: `ATS compatibility checked. Score: ${r.atsScore}%`,
                    timestamp: r.updatedAt,
                });
            }
        });

        // Add interview events
        allInterviews.forEach(i => {
            timeline.push({
                id: `event-int-st-${i._id}`,
                type: 'interview',
                title: 'Mock Interview Started',
                description: `Role: ${i.jobRole} (${i.difficulty})`,
                timestamp: i.createdAt,
            });
            if (i.status === 'completed') {
                timeline.push({
                    id: `event-int-co-${i._id}`,
                    type: 'achievement',
                    title: 'Mock Interview Completed',
                    description: `Completed interview. Score: ${i.summary?.overallScore || i.overallScore}%`,
                    timestamp: i.completedAt,
                });
            }
        });

        // Add roadmap events
        if (activeRoadmap) {
            timeline.push({
                id: `event-rd-st-${activeRoadmap._id}`,
                type: 'roadmap',
                title: 'Learning Roadmap Started',
                description: `Active target: ${activeRoadmap.targetRole}`,
                timestamp: activeRoadmap.createdAt,
            });
            activeRoadmap.milestones.forEach(m => {
                if (m.status === 'completed' && m.completedAt) {
                    timeline.push({
                        id: `event-rd-ms-${m._id}`,
                        type: 'achievement',
                        title: `Milestone Completed: ${m.title}`,
                        description: `Finished learning skill: ${m.title}`,
                        timestamp: m.completedAt,
                    });
                }
            });
        }

        // Sort events chronologically descending
        const sortedTimeline = timeline
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);

        res.status(200).json({
            success: true,
            data: {
                careerReadiness,
                breakdown,
                recommendations: topRecommendations,
                timeline: sortedTimeline,
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardMetrics,
};
