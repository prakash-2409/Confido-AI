/**
 * Analytics Model
 * 
 * Tracks user activity and system metrics for analytics dashboard.
 */

const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        event: {
            type: String,
            required: true,
            enum: [
                'resume_upload',
                'resume_analyze',
                'interview_start',
                'interview_complete',
                'login',
                'register',
                'profile_update',
                'subscription_upgrade',
                'subscription_cancel',
            ],
            index: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        // Denormalized for fast aggregation
        date: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
analyticsEventSchema.index({ event: 1, date: -1 });
analyticsEventSchema.index({ user: 1, event: 1, date: -1 });

/**
 * Static: Track an event
 */
analyticsEventSchema.statics.track = async function (userId, event, metadata = {}) {
    try {
        return await this.create({
            user: userId,
            event,
            metadata,
            date: new Date(),
        });
    } catch (error) {
        // Don't throw on analytics failures
        console.error('Analytics tracking error:', error.message);
        return null;
    }
};

/**
 * Static: Get event counts by date range
 */
analyticsEventSchema.statics.getEventCounts = async function (startDate, endDate, event = null) {
    const match = {
        date: { $gte: startDate, $lte: endDate },
    };
    if (event) match.event = event;

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    event: '$event',
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.date': 1 } },
    ]);
};

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;
