/**
 * Video Interview Model (P3 - Growth Feature)
 * 
 * Stores video interview sessions with speech analysis data.
 * Supports future integration with video recording, transcription,
 * and AI-powered speech/confidence analysis.
 */

const mongoose = require('mongoose');

const videoInterviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    targetRole: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['scheduled', 'recording', 'processing', 'analyzed', 'error'],
        default: 'scheduled',
    },
    // Video metadata
    videoUrl: String,
    duration: Number, // seconds
    thumbnailUrl: String,

    // Speech Analysis Results
    speechAnalysis: {
        // Transcription
        transcript: String,
        wordCount: Number,
        
        // Speech metrics
        speakingRate: Number, // words per minute
        fillerWordCount: Number,
        fillerWords: [String],
        pauseFrequency: Number,
        averagePauseDuration: Number,
        
        // Confidence scoring
        confidenceScore: Number, // 0-100
        clarityScore: Number, // 0-100
        engagementScore: Number, // 0-100
        
        // Tone analysis
        toneAnalysis: {
            confident: Number,
            nervous: Number,
            enthusiastic: Number,
            monotone: Number,
        },
        
        // Body language (future: via video analysis)
        bodyLanguage: {
            eyeContact: Number,
            posture: Number,
            gestures: Number,
        },
    },

    // AI Feedback
    feedback: {
        strengths: [String],
        improvements: [String],
        overallScore: Number,
        recommendations: [String],
    },

    questions: [{
        questionText: String,
        startTime: Number,
        endTime: Number,
        answer: String,
        score: Number,
        feedback: String,
    }],
}, {
    timestamps: true,
});

videoInterviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('VideoInterview', videoInterviewSchema);
