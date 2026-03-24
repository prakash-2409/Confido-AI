/**
 * Admin Controller
 * 
 * Provides admin-only endpoints for:
 * - Dashboard statistics
 * - User management
 * - Analytics data
 * - System health overview
 */

const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

/**
 * Get admin dashboard statistics
 * GET /api/v1/admin/stats
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        // Parallel queries for performance
        const [
            totalUsers,
            newUsersThisMonth,
            newUsersThisWeek,
            verifiedUsers,
            totalResumes,
            analyzedResumes,
            totalInterviews,
            completedInterviews,
            proUsers,
            avgAtsScore,
            avgInterviewScore,
            recentSignups,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            User.countDocuments({ isEmailVerified: true }),
            Resume.countDocuments(),
            Resume.countDocuments({ status: 'analyzed' }),
            Interview.countDocuments(),
            Interview.countDocuments({ status: 'completed' }),
            User.countDocuments({ 'subscription.plan': { $ne: 'free' } }),
            Resume.aggregate([
                { $match: { atsScore: { $ne: null } } },
                { $group: { _id: null, avg: { $avg: '$atsScore' } } },
            ]),
            Interview.aggregate([
                { $match: { 'summary.overallScore': { $ne: null } } },
                { $group: { _id: null, avg: { $avg: '$summary.overallScore' } } },
            ]),
            User.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .select('name email createdAt isEmailVerified subscription.plan'),
        ]);

        // Daily signups for the last 30 days
        const dailySignups = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Daily interviews for the last 30 days
        const dailyInterviews = await Interview.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    newUsersThisMonth,
                    newUsersThisWeek,
                    verifiedUsers,
                    verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
                    totalResumes,
                    analyzedResumes,
                    totalInterviews,
                    completedInterviews,
                    completionRate: totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0,
                    proUsers,
                    conversionRate: totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0,
                    avgAtsScore: avgAtsScore[0]?.avg ? Math.round(avgAtsScore[0].avg) : 0,
                    avgInterviewScore: avgInterviewScore[0]?.avg ? Math.round(avgInterviewScore[0].avg) : 0,
                },
                charts: {
                    dailySignups,
                    dailyInterviews,
                },
                recentSignups,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users (paginated)
 * GET /api/v1/admin/users
 */
const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const plan = req.query.plan || '';
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (plan) {
            filter['subscription.plan'] = plan;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('name email role isActive isEmailVerified subscription profileCompleteness createdAt lastLogin'),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get analytics data
 * GET /api/v1/admin/analytics
 */
const getAnalytics = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const endDate = new Date();

        // Get event counts by type
        const eventCounts = await AnalyticsEvent.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: '$event',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Get daily active users
        const dailyActiveUsers = await AnalyticsEvent.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        user: '$user',
                    },
                },
            },
            {
                $group: {
                    _id: '$_id.date',
                    activeUsers: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Top users by activity
        const topUsers = await AnalyticsEvent.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: '$user',
                    eventCount: { $sum: 1 },
                },
            },
            { $sort: { eventCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo',
                },
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    name: '$userInfo.name',
                    email: '$userInfo.email',
                    eventCount: 1,
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                period: { startDate, endDate, days },
                eventCounts: eventCounts.reduce((acc, e) => {
                    acc[e._id] = e.count;
                    return acc;
                }, {}),
                dailyActiveUsers,
                topUsers,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle user active status
 * PUT /api/v1/admin/users/:id/toggle-status
 */
const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) throw new ApiError(404, 'User not found');

        // Prevent deactivating self
        if (user._id.toString() === req.userId) {
            throw new ApiError(400, 'Cannot deactivate your own account');
        }

        user.isActive = !user.isActive;
        await user.save();

        logger.info('User status toggled', { userId: user._id, isActive: user.isActive, by: req.userId });

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { user: { id: user._id, isActive: user.isActive } },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    getAnalytics,
    toggleUserStatus,
};
