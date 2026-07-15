/**
 * Job Match Controller
 * 
 * Handles HTTP layer for the Job Match Intelligence Engine:
 * - analyzeJobMatch: Full analysis pipeline (text or PDF)
 * - getMyMatches: List all user's match analyses
 * - getMatchById: Fetch single analysis with full details
 * - deleteMatch: Remove an analysis (ownership verified)
 */

const JobMatch = require('../models/JobMatch');
const { runFullAnalysis } = require('../services/jobMatchService');
const { parseResume } = require('../utils/resumeParser');
const { ApiError } = require('../middlewares/errorHandler');
const fs = require('fs');

/**
 * Analyze a job description against user's profile + resume
 * POST /api/v1/job-match/analyze
 * 
 * Body: { jobDescriptionText, resumeId?, jobTitle?, company? }
 * OR: multipart form with 'jobDescriptionFile' (PDF) + optional fields
 */
const analyzeJobMatch = async (req, res, next) => {
    try {
        let jobDescriptionText = req.body.jobDescriptionText || '';
        const { resumeId, jobTitle, company } = req.body;

        // Handle PDF upload
        if (req.file) {
            try {
                const extractedText = await parseResume(req.file);
                if (extractedText && extractedText.length > 20) {
                    jobDescriptionText = extractedText;
                }
            } catch (parseError) {
                // Ignore parse failure if text was also provided
                if (!jobDescriptionText) {
                    throw new ApiError(400, 'Failed to extract text from uploaded file. Please paste the job description instead.');
                }
            } finally {
                // Clean up uploaded file
                if (req.file.path && fs.existsSync(req.file.path)) {
                    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
                }
            }
        }

        // Validate
        if (!jobDescriptionText || jobDescriptionText.trim().length < 50) {
            throw new ApiError(400, 'Job description must be at least 50 characters. Paste the full job listing for best results.');
        }

        // Run the full analysis pipeline
        const result = await runFullAnalysis(req.user._id, jobDescriptionText.trim(), {
            resumeId: resumeId || null,
            jobTitle: jobTitle || undefined,
            company: company || undefined,
        });

        res.status(201).json({
            success: true,
            message: 'Job match analysis completed',
            data: { jobMatch: result },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all job match analyses for the current user
 * GET /api/v1/job-match
 */
const getMyMatches = async (req, res, next) => {
    try {
        const matches = await JobMatch.find({ user: req.user._id })
            .select('-jobDescriptionText -extractedRequirements.responsibilities')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.status(200).json({
            success: true,
            data: {
                count: matches.length,
                matches,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single job match analysis with full details
 * GET /api/v1/job-match/:id
 */
const getMatchById = async (req, res, next) => {
    try {
        const match = await JobMatch.findOne({
            _id: req.params.id,
            user: req.user._id,
        }).lean();

        if (!match) {
            throw new ApiError(404, 'Job match analysis not found');
        }

        res.status(200).json({
            success: true,
            data: { jobMatch: match },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a job match analysis
 * DELETE /api/v1/job-match/:id
 */
const deleteMatch = async (req, res, next) => {
    try {
        const match = await JobMatch.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!match) {
            throw new ApiError(404, 'Job match analysis not found');
        }

        await JobMatch.deleteOne({ _id: match._id });

        res.status(200).json({
            success: true,
            message: 'Job match analysis deleted',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    analyzeJobMatch,
    getMyMatches,
    getMatchById,
    deleteMatch,
};
