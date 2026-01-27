/**
 * Resume Parsing Utility
 * 
 * Handles text extraction from:
 * - PDF files (using pdf-parse v1.x)
 * - DOCX files (using mammoth)
 */

const fs = require('fs');
const path = require('path');

const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Extract text from a uploaded resume file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - Extracted text
 */
const parseResume = async (file) => {
    try {
        console.log('📄 Parsing resume:', file.originalname, 'Type:', file.mimetype);
        
        const buffer = fs.readFileSync(file.path);
        console.log('📄 File buffer size:', buffer.length, 'bytes');

        if (file.mimetype === 'application/pdf') {
            return await parsePdf(buffer, file.originalname);
        }
        else if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'application/msword'
        ) {
            return await parseDocx(buffer);
        }
        else {
            throw new ApiError(400, 'Unsupported file format. Please upload PDF or DOCX.');
        }
    } catch (error) {
        console.error('❌ Resume parsing error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Failed to parse resume: ${error.message}`);
    }
};

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer 
 * @param {string} filename - Original filename for logging
 * @returns {Promise<string>}
 */
const parsePdf = async (buffer, filename = 'unknown') => {
    try {
        console.log('📄 Attempting PDF parse for:', filename);
        
        const data = await pdf(buffer);
        console.log('✅ PDF parsed successfully. Pages:', data.numpages, 'Text length:', data.text?.length);
        
        if (!data.text || data.text.trim().length === 0) {
            throw new Error('PDF appears to be empty or image-based (no extractable text)');
        }
        
        return cleanText(data.text);
    } catch (error) {
        console.error('❌ PDF parse error details:', error.message);
        console.error('❌ Full error:', error);
        throw new Error(`Could not parse PDF file: ${error.message}`);
    }
};

/**
 * Extract text from DOCX buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const parseDocx = async (buffer) => {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return cleanText(result.value);
    } catch (error) {
        console.error('DOCX parse error:', error); // Log actual error for debugging
        throw new Error('Could not parse DOCX file');
    }
};

/**
 * Clean extracted text options
 * - Remove excessive whitespace
 * - Normalize newlines
 * - Remove null characters
 * @param {string} text 
 * @returns {string}
 */
const cleanText = (text) => {
    if (!text) return '';

    return text
        .replace(/\0/g, '') // Remove null bytes
        .replace(/(\r\n|\n|\r)/gm, '\n') // Normalize newlines
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
};

module.exports = {
    parseResume,
};
