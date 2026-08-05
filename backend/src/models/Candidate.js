const mongoose = require('mongoose');

const skillEvidenceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    sources: [{ type: String }],
    level: { type: String, enum: ['verified', 'collected', 'review', 'risk'], default: 'collected' },
    reasoning: { type: String, default: '' }
}, { _id: false });

const hiringDimensionSchema = new mongoose.Schema({
    dimension: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, default: 0 },
    reasoning: { type: String, default: '' }
}, { _id: false });

const riskIndicatorSchema = new mongoose.Schema({
    risk: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    detail: { type: String, default: '' }
}, { _id: false });

const timelineEventSchema = new mongoose.Schema({
    date: { type: String, required: true }, // e.g. "2d ago" or timestamp
    action: { type: String, required: true },
    detail: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const candidateNoteSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, default: 'Recruiter' },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const candidateSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Candidate name is required'], trim: true },
    role: { type: String, required: [true, 'Candidate role is required'], trim: true },
    email: { type: String, required: [true, 'Candidate email is required'], trim: true },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    experience: { type: String, default: '' },
    status: {
        type: String,
        enum: ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
        default: 'New'
    },
    evidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    hiringReadiness: { type: Number, min: 0, max: 100, default: 0 },
    authenticityScore: { type: Number, min: 0, max: 100, default: 0 },
    summary: { type: String, default: '' },
    skills: [skillEvidenceSchema],
    hiringDimensions: [hiringDimensionSchema],
    riskIndicators: [riskIndicatorSchema],
    timeline: [timelineEventSchema],
    sources: {
        resume: { type: Boolean, default: false },
        github: { type: Boolean, default: false },
        interview: { type: Boolean, default: false },
        assessment: { type: Boolean, default: false },
        linkedin: { type: Boolean, default: false }
    },
    notes: [candidateNoteSchema],
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for status and email search
candidateSchema.index({ email: 1 });
candidateSchema.index({ status: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
