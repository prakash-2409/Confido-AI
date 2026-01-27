/**
 * Resume Controller
 * 
 * Handles:
 * - Resume file upload
 * - Parsing text from resume
 * - Saving to database
 * - Retrieving user's resumes
 */

const fs = require('fs');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { parseResume } = require('../utils/resumeParser');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Upload and parse a new resume
 * POST /api/v1/resume/upload
 */
const uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ApiError(400, 'No file uploaded');
        }

        // 1. Parse text from file
        let extractedText;
        try {
            extractedText = await parseResume(req.file);
        } catch (parseError) {
            // Clean up file if parsing fails
            fs.unlinkSync(req.file.path);
            throw parseError;
        }

        if (!extractedText || extractedText.length < 50) {
            // Clean up
            fs.unlinkSync(req.file.path);
            throw new ApiError(400, 'Could not extract enough text from resume. Please ensure it is text-based (not scanned image).');
        }

        // 2. Save to database
        const resume = await Resume.create({
            user: req.user._id,
            originalName: req.file.originalname,
            fileName: req.file.filename,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
            extractedText: extractedText,
            status: 'uploaded', // Ready for analysis
        });

        // 3. Update user profile
        await User.findByIdAndUpdate(req.user._id, {
            hasUploadedResume: true,
            profileCompleteness: Math.max(req.user.profileCompleteness || 0, 50), // Resume bumps progress
        });

        // 4. Send response
        res.status(201).json({
            success: true,
            message: 'Resume uploaded and processed successfully',
            data: {
                resume: {
                    id: resume._id,
                    fileName: resume.originalName,
                    uploadedAt: resume.createdAt,
                    status: resume.status,
                    textLength: extractedText.length,
                    preview: extractedText.substring(0, 200) + '...',
                },
            },
        });

        // Valid place to trigger async analysis (RabbitMQ/Job Queue in production)
    } catch (error) {
        next(error);
    }
};

/**
 * Get all resumes for current user
 * GET /api/v1/resume
 */
const getMyResumes = async (req, res, next) => {
    try {
        const resumes = await Resume.find({ user: req.user._id })
            .select('-extractedText') // Exclude heavy text
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                count: resumes.length,
                resumes,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get specific resume details
 * GET /api/v1/resume/:id
 */
const getResumeById = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            user: req.user._id, // Ensure ownership
        });

        if (!resume) {
            throw new ApiError(404, 'Resume not found');
        }

        res.status(200).json({
            success: true,
            data: {
                resume,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a resume
 * DELETE /api/v1/resume/:id
 */
const deleteResume = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!resume) {
            throw new ApiError(404, 'Resume not found');
        }

        // 1. Delete file from filesystem
        if (fs.existsSync(resume.filePath)) {
            try {
                fs.unlinkSync(resume.filePath);
            } catch (err) {
                console.error('Failed to delete file:', err);
                // Continue to delete DB record even if file deletion fails
            }
        }

        // 2. Delete from database
        await Resume.deleteOne({ _id: resume._id });

        // 3. Check if user has other resumes
        const count = await Resume.countDocuments({ user: req.user._id });
        if (count === 0) {
            await User.findByIdAndUpdate(req.user._id, { hasUploadedResume: false });
        }

        res.status(200).json({
            success: true,
            message: 'Resume deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadResume,
    getMyResumes,
    getResumeById,
    deleteResume,
};
