/**
 * Company Interview Model (P3 - Growth Feature)
 * 
 * Stores company-specific interview configurations and questions
 * for targeted mock interview practice.
 */

const mongoose = require('mongoose');

const companyInterviewSchema = new mongoose.Schema({
    company: {
        type: String,
        required: true,
        index: true,
    },
    companyLogo: String,
    role: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    interviewStyle: {
        type: String,
        enum: ['behavioral', 'technical', 'case_study', 'system_design', 'mixed'],
        default: 'mixed',
    },
    // Company-specific interview data
    interviewProcess: {
        rounds: Number,
        description: String,
        typicalDuration: String,
        tips: [String],
    },
    questions: [{
        questionText: { type: String, required: true },
        category: String,
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
        expectedTopics: [String],
        sampleAnswer: String,
        source: { type: String, enum: ['community', 'ai_generated', 'verified'], default: 'ai_generated' },
    }],
    // Metadata
    popularity: { type: Number, default: 0 },
    successRate: Number,
    lastUpdated: Date,
    isVerified: { type: Boolean, default: false },
    createdBy: {
        type: String,
        enum: ['system', 'admin', 'community'],
        default: 'system',
    },
}, {
    timestamps: true,
});

companyInterviewSchema.index({ company: 1, role: 1 });
companyInterviewSchema.index({ popularity: -1 });

// Static: Get popular companies
companyInterviewSchema.statics.getPopularCompanies = function(limit = 20) {
    return this.aggregate([
        { $group: { _id: '$company', count: { $sum: 1 }, avgDifficulty: { $avg: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, { $cond: [{ $eq: ['$difficulty', 'medium'] }, 2, 3] }] } } } },
        { $sort: { count: -1 } },
        { $limit: limit },
    ]);
};

module.exports = mongoose.model('CompanyInterview', companyInterviewSchema);
