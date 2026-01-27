/**
 * File Upload Middleware Configuration
 * 
 * Uses Multer to handle multipart/form-data
 * Configures storage location and file filters
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ApiError } = require('./errorHandler');
const config = require('../config/env');

// Ensure upload directory exists
if (!fs.existsSync(config.upload.uploadPath)) {
    fs.mkdirSync(config.upload.uploadPath, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: user-<userId>-<timestamp>.<ext>
        // Note: req.user is attached by auth middleware only if this comes AFTER auth
        // But multer runs before controller, so we rely on unique prefix
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

// File filter (PDF and DOCX only)
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Invalid file type. Only PDF and DOCX are allowed.'), false);
    }
};

// Multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize, // Default 5MB
    },
});

module.exports = upload;
