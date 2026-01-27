/**
 * Interview Model
 * 
 * Manages the interview lifecycle:
 * - Session tracking
 * - Generated questions
 * - User answers
 * - Evaluation results
 */

const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: String,
        required: true,
    },
    questionText: {
        type: String,
        required: true,
    },
    userAnswer: {
        type: String,
        required: true,
    },
    audioUrl: {
        type: String, // Optional: if we add voice later
    },

    // AI Evaluation
    score: {
        type: Number, // 0-100
        default: null,
    },
    feedback: {
        type: String,
        default: null,
    },
    keywordsFound: [{
        type: String,
    }],
    improvements: [{
        type: String,
    }],

    answeredAt: {
        type: Date,
        default: Date.now,
    },
});

const interviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        resume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resume',
            required: true,
        },

        // Context
        jobTitle: {
            type: String,
            required: true,
        },
        jobDescription: {
            type: String,
            required: true,
        },

        // Status
        status: {
            type: String,
            enum: ['created', 'in_progress', 'completed'],
            default: 'created',
        },

        // Content
        questions: [{
            id: String,
            text: String,
            category: String, // e.g., 'technical', 'behavioral', 'system_design'
            complexity: String, // e.g., 'easy', 'medium', 'hard'
            expectedKeywords: [String], // Hidden from user, used for evaluation
        }],

        answers: [answerSchema],

        // Aggregate Results
        overallScore: {
            type: Number,
            default: null,
        },
        overallFeedback: {
            type: String,
            default: null,
        },

        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
interviewSchema.index({ user: 1, createdAt: -1 });

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
