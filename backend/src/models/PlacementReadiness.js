const mongoose = require('mongoose');

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const personalInfoSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' }
}, { _id: false });

const educationSchema = new mongoose.Schema({
    college: { type: String, default: '' },
    degree: { type: String, default: '' },
    cgpa: { type: String, default: '' },
    graduationYear: { type: String, default: '' }
}, { _id: false });

const experienceItemSchema = new mongoose.Schema({
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    duration: { type: String, default: '' },
    description: { type: String, default: '' }
}, { _id: false });

const projectItemSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    technologies: [{ type: String }],
    githubUrl: { type: String, default: '' }
}, { _id: false });

const parsedResumeSchema = new mongoose.Schema({
    personal: { type: personalInfoSchema, default: () => ({}) },
    education: [educationSchema],
    experience: [experienceItemSchema],
    projects: [projectItemSchema],
    skills: [{ type: String }],
    certifications: [{ type: String }],
    achievements: [{ type: String }],
    languages: [{ type: String }],
    internships: [experienceItemSchema],
    publications: [{ type: String }],
    volunteer: [experienceItemSchema]
}, { _id: false });

const githubRepoSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    url: { type: String, default: '' },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    language: { type: String, default: '' },
    complexity: { type: Number, default: 0 } // Computed complexity percentage
}, { _id: false });

const githubAnalysisSchema = new mongoose.Schema({
    profileUrl: { type: String, default: '' },
    githubScore: { type: Number, default: 0 },
    projectQualityScore: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    developerActivityScore: { type: Number, default: 0 },
    languages: [{ type: String }],
    repositories: [githubRepoSchema],
    openSourceActivity: { type: String, default: 'None detected' },
    commitFrequency: { type: String, default: 'Low' },
    recentActivity: { type: String, default: '' }
}, { _id: false });

const gapSkillItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    importance: { type: String, enum: ['critical', 'important', 'nice_to_have'], default: 'important' },
    learningDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    estimatedLearningTime: { type: String, default: '2-4 weeks' }
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
    missingSkills: [gapSkillItemSchema],
    weakSkills: [gapSkillItemSchema],
    strongSkills: [{ type: String }],
    irrelevantSkills: [{ type: String }]
}, { _id: false });

const categoryScoresSchema = new mongoose.Schema({
    technicalSkills: { type: Number, default: 0 },
    resumeQuality: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    github: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    consistency: { type: Number, default: 0 }
}, { _id: false });

const evidenceItemSchema = new mongoose.Schema({
    category: { type: String, required: true },
    score: { type: Number, default: 0 },
    evidenceList: [{ type: String }]
}, { _id: false });

const roadmapPlanSchema = new mongoose.Schema({
    weeklyGoals: [{ type: String }],
    thirtyDayPlan: [{ type: String }],
    ninetyDayPlan: [{ type: String }]
}, { _id: false });

const recommendationsSchema = new mongoose.Schema({
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    priorityImprovements: [{ type: String }],
    resumeSuggestions: [{ type: String }],
    projectSuggestions: [{ type: String }],
    certificationSuggestions: [{ type: String }],
    githubSuggestions: [{ type: String }],
    roadmap: { type: roadmapPlanSchema, default: () => ({}) }
}, { _id: false });

// ── Main Schema ──────────────────────────────────────────────────────────────

const placementReadinessSchema = new mongoose.Schema(
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
        targetRole: {
            type: String,
            required: true
        },
        parsedResume: {
            type: parsedResumeSchema,
            default: () => ({})
        },
        githubAnalysis: {
            type: githubAnalysisSchema,
            default: () => ({})
        },
        skillGap: {
            type: skillGapSchema,
            default: () => ({})
        },
        readinessScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 0
        },
        categoryScores: {
            type: categoryScoresSchema,
            default: () => ({})
        },
        evidence: [evidenceItemSchema],
        recommendations: {
            type: recommendationsSchema,
            default: () => ({})
        },
        version: {
            type: Number,
            default: 1
        }
    },
    {
        timestamps: true
    }
);

// Compound index for retrieval history
placementReadinessSchema.index({ user: 1, createdAt: -1 });

const PlacementReadiness = mongoose.model('PlacementReadiness', placementReadinessSchema);

module.exports = PlacementReadiness;
