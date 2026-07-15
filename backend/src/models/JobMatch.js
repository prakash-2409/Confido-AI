/**
 * JobMatch Model
 * 
 * Stores job description analysis results including:
 * - Extracted requirements from JD
 * - Match score breakdown (skills, experience, tools, education)
 * - Gap analysis with prioritized missing skills
 * - Hiring probability assessment
 * - Improvement simulations with projected score impact
 * - Interview topic predictions
 */

const mongoose = require('mongoose');

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const extractedRequirementsSchema = new mongoose.Schema({
    skills: [{ type: String, trim: true }],
    experience: {
        minYears: { type: Number, default: 0 },
        maxYears: { type: Number, default: null },
        level: { 
            type: String, 
            enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'any'],
            default: 'any' 
        },
    },
    education: [{ type: String, trim: true }],
    responsibilities: [{ type: String, trim: true }],
    tools: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
}, { _id: false });

const matchResultSchema = new mongoose.Schema({
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    categoryScores: {
        skills: { type: Number, min: 0, max: 100, default: 0 },
        experience: { type: Number, min: 0, max: 100, default: 0 },
        tools: { type: Number, min: 0, max: 100, default: 0 },
        education: { type: Number, min: 0, max: 100, default: 0 },
    },
    matchedSkills: [{ type: String, trim: true }],
    missingSkills: [{ type: String, trim: true }],
    matchedTools: [{ type: String, trim: true }],
    missingTools: [{ type: String, trim: true }],
    experienceMatch: {
        required: { type: String, default: 'Not specified' },
        actual: { type: String, default: 'Not specified' },
        verdict: { type: String, enum: ['exceeds', 'meets', 'below', 'unknown'], default: 'unknown' },
    },
    educationMatch: {
        required: [{ type: String }],
        actual: { type: String, default: 'Not specified' },
        verdict: { type: String, enum: ['meets', 'below', 'unknown'], default: 'unknown' },
    },
}, { _id: false });

const gapItemSchema = new mongoose.Schema({
    skill: { type: String, trim: true },
    importance: { type: String, enum: ['critical', 'important', 'nice_to_have'], default: 'important' },
    estimatedLearningTime: { type: String, default: null },
}, { _id: false });

const techGapSchema = new mongoose.Schema({
    tech: { type: String, trim: true },
    importance: { type: String, enum: ['critical', 'important', 'nice_to_have'], default: 'important' },
}, { _id: false });

const gapAnalysisSchema = new mongoose.Schema({
    missingSkills: [gapItemSchema],
    missingTechnologies: [techGapSchema],
    missingExperience: [{ type: String }],
    missingInterviewPrep: [{ type: String }],
}, { _id: false });

const hiringProbabilitySchema = new mongoose.Schema({
    level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    reasoning: [{ type: String }],
    topBlockers: [{ type: String }],
}, { _id: false });

const improvementSchema = new mongoose.Schema({
    action: { type: String, required: true },
    currentScore: { type: Number, min: 0, max: 100 },
    projectedScore: { type: Number, min: 0, max: 100 },
    impact: { type: Number, default: 0 },
}, { _id: false });

const predictedQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    category: { type: String, enum: ['technical', 'behavioral', 'situational', 'system_design'], default: 'technical' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
}, { _id: false });

const interviewPredictionSchema = new mongoose.Schema({
    likelyTopics: [{ type: String }],
    predictedQuestions: [predictedQuestionSchema],
    preparationTips: [{ type: String }],
}, { _id: false });

// ── Main Schema ──────────────────────────────────────────────────────────────

const jobMatchSchema = new mongoose.Schema(
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
            default: null,
        },

        // Job Description Metadata
        jobTitle: {
            type: String,
            trim: true,
            default: 'Untitled Position',
        },
        company: {
            type: String,
            trim: true,
            default: null,
        },
        jobDescriptionText: {
            type: String,
            required: [true, 'Job description text is required'],
        },

        // Structured Analysis Results
        extractedRequirements: {
            type: extractedRequirementsSchema,
            default: () => ({}),
        },
        matchResult: {
            type: matchResultSchema,
            default: () => ({}),
        },
        gapAnalysis: {
            type: gapAnalysisSchema,
            default: () => ({}),
        },
        hiringProbability: {
            type: hiringProbabilitySchema,
            default: () => ({}),
        },
        improvementSimulations: [improvementSchema],
        interviewPrediction: {
            type: interviewPredictionSchema,
            default: () => ({}),
        },

        // Status
        status: {
            type: String,
            enum: ['analyzing', 'completed', 'error'],
            default: 'analyzing',
        },
        errorMessage: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for fast user queries sorted by date
jobMatchSchema.index({ user: 1, createdAt: -1 });

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);

module.exports = JobMatch;
