/**
 * Resume Model
 * 
 * Stores resume data including:
 * - Reference to User
 * - File details (path, name, type)
 * - Extracted text content
 * - ATS Score (computed by ML service)
 * - Parsed skills (computed by ML service)
 */

const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // File Information
        originalName: {
            type: String,
            required: true,
            trim: true,
        },
        fileName: {
            type: String,
            required: true,
            unique: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },

        // Processed Data
        extractedText: {
            type: String,
            required: true, // We must be able to extract text to use it
        },

        // AI Analysis Results (Populated later)
        atsScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null,
        },
        skills: [{
            type: String,
            trim: true,
        }],
        missingKeywords: [{
            type: String,
            trim: true,
        }],
        summary: {
            type: String,
            trim: true,
        },

        // Status
        status: {
            type: String,
            enum: ['uploaded', 'analyzing', 'analyzed', 'error'],
            default: 'uploaded',
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

// Allow user to have multiple resumes, but sort by createdAt
resumeSchema.index({ user: 1, createdAt: -1 });

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
