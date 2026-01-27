/**
 * ATS Analysis Controller
 * 
 * Handles resume analysis requests
 */

const Resume = require('../models/Resume');
const { analyzeResume } = require('../services/mlService');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Analyze a resume against a job description
 * POST /api/v1/resume/:id/analyze
 * Body: { jobDescription: "..." }
 */
const analyzeResumeAgainstJob = async (req, res, next) => {
    try {
        const { jobDescription } = req.body;

        if (!jobDescription || jobDescription.length < 50) {
            throw new ApiError(400, 'Please provide a valid job description (min 50 chars)');
        }

        // 1. Get Resume
        const resume = await Resume.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!resume) {
            throw new ApiError(404, 'Resume not found');
        }

        // 2. Call ML Service
        const analysis = await analyzeResume(resume.extractedText, jobDescription);

        // 3. Update Resume with results (optional: or store as separate Analysis record)
        // For now, we just return the analysis, but in a real app might want to save history
        resume.atsScore = analysis.score;
        resume.skills = analysis.matched_keywords;
        resume.missingKeywords = analysis.missing_keywords;
        resume.status = 'analyzed';
        await resume.save();

        // 4. Return results
        res.status(200).json({
            success: true,
            data: {
                score: analysis.score,
                matchedKeywords: analysis.matched_keywords,
                missingKeywords: analysis.missing_keywords,
                summary: analysis.summary,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    analyzeResumeAgainstJob,
};
