/**
 * Interview Model
 * 
 * Manages the interview lifecycle:
 * - Session tracking
 * - Generated questions
 * - User answers
 * - Evaluation results
 * - Interview summary and readiness assessment
 */

const mongoose = require('mongoose');

// Schema for individual question
const questionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    questionText: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['behavioral', 'technical', 'situational'],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    expectedKeywords: [{
        type: String,
    }],
    relatedSkill: {
        type: String,
        default: null,
    },
}, { _id: false });

// Schema for answer with detailed evaluation
const answerSchema = new mongoose.Schema({
    questionId: {
        type: String,
        required: true,
    },
    questionText: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['behavioral', 'technical', 'situational'],
        required: true,
    },
    answerText: {
        type: String,
        required: true,
    },

    // AI Evaluation Results
    score: {
        type: Number, // 0-100
        min: 0,
        max: 100,
        default: null,
    },
    feedback: {
        type: String,
        default: null,
    },
    strengths: [{
        type: String,
    }],
    improvements: [{
        type: String,
    }],
    keywordsFound: [{
        type: String,
    }],
    keywordsMissed: [{
        type: String,
    }],

    answeredAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

// Schema for interview summary
const summarySchema = new mongoose.Schema({
    overallScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
    },
    readinessLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: null,
    },
    strongAreas: [{
        type: String,
    }],
    weakAreas: [{
        type: String,
    }],
    categoryScores: {
        behavioral: { type: Number, default: null },
        technical: { type: Number, default: null },
        situational: { type: Number, default: null },
    },
    recommendations: [{
        type: String,
    }],
    feedbackSummary: {
        type: String,
        default: null,
    },
}, { _id: false });

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
            default: null, // Optional - can start interview without resume
        },

        // Job Context
        jobRole: {
            type: String,
            required: [true, 'Job role is required'],
            trim: true,
        },
        jobDescription: {
            type: String,
            default: '',
        },

        // Interview difficulty
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },

        // Extracted from JD
        extractedSkills: [{
            type: String,
        }],

        // Session State
        status: {
            type: String,
            enum: ['in_progress', 'completed'],
            default: 'in_progress',
        },
        currentQuestionIndex: {
            type: Number,
            default: 0,
        },
        totalQuestions: {
            type: Number,
            default: 0,
        },

        // Questions and Answers
        questions: [questionSchema],
        answers: [answerSchema],

        // Final Summary (populated on completion)
        summary: {
            type: summarySchema,
            default: null,
        },

        // Timestamps
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for progress percentage
interviewSchema.virtual('progress').get(function() {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.answers.length / this.totalQuestions) * 100);
});

// Method to check if all questions are answered
interviewSchema.methods.isAllQuestionsAnswered = function() {
    return this.answers.length >= this.questions.length;
};

// Method to get next unanswered question
interviewSchema.methods.getNextQuestion = function() {
    if (this.currentQuestionIndex >= this.questions.length) {
        return null;
    }
    return this.questions[this.currentQuestionIndex];
};

// Ensure virtuals are included in JSON
interviewSchema.set('toJSON', { virtuals: true });
interviewSchema.set('toObject', { virtuals: true });

// Indexes
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ user: 1, status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
