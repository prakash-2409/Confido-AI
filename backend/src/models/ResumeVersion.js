const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        resume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resume',
            required: true
        },
        version: {
            type: Number,
            required: true
        },
        parsedResume: {
            type: Object,
            default: () => ({})
        },
        atsScore: {
            type: Number,
            default: 0
        },
        readinessScore: {
            type: Number,
            default: 0
        },
        categoryScores: {
            type: Object,
            default: () => ({})
        },
        recommendations: {
            type: Object,
            default: () => ({})
        },
        githubSnapshot: {
            type: Object,
            default: () => ({})
        },
        jobMatch: {
            type: Object,
            default: () => ({})
        }
    },
    {
        timestamps: true
    }
);

// Index to fetch versions for a user
resumeVersionSchema.index({ user: 1, version: -1 });

const ResumeVersion = mongoose.model('ResumeVersion', resumeVersionSchema);

module.exports = ResumeVersion;
