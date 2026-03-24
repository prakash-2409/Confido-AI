/**
 * Learning Roadmap Model (P3 - Growth Feature)
 * 
 * Stores personalized learning roadmaps generated based on
 * user's resume analysis, interview performance, and target role.
 */

const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    category: {
        type: String,
        enum: ['technical', 'behavioral', 'domain', 'soft_skills', 'certification'],
    },
    priority: {
        type: String,
        enum: ['critical', 'important', 'nice_to_have'],
        default: 'important',
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'skipped'],
        default: 'not_started',
    },
    estimatedHours: Number,
    resources: [{
        title: String,
        url: String,
        type: { type: String, enum: ['course', 'article', 'video', 'book', 'project'] },
        free: { type: Boolean, default: true },
    }],
    skills: [String],
    completedAt: Date,
    order: Number,
});

const learningRoadmapSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    targetRole: {
        type: String,
        required: true,
    },
    currentLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate',
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'archived'],
        default: 'active',
    },
    // Analysis inputs that generated this roadmap
    basedOn: {
        resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
        interviewIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interview' }],
        skillGaps: [String],
        strengths: [String],
    },
    milestones: [milestoneSchema],
    estimatedTotalHours: Number,
    completionPercentage: { type: Number, default: 0 },
    targetCompletionDate: Date,
    aiInsights: {
        summary: String,
        keyFocus: [String],
        estimatedTimeToReady: String,
    },
}, {
    timestamps: true,
});

learningRoadmapSchema.index({ user: 1, status: 1 });

// Calculate completion percentage
learningRoadmapSchema.methods.updateCompletion = function() {
    if (!this.milestones.length) return;
    const completed = this.milestones.filter(m => m.status === 'completed').length;
    this.completionPercentage = Math.round((completed / this.milestones.length) * 100);
};

module.exports = mongoose.model('LearningRoadmap', learningRoadmapSchema);
