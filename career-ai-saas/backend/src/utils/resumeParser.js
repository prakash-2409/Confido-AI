/**
 * Resume Parsing Utility
 * 
 * Handles text extraction from:
 * - PDF files (using pdf-parse)
 * - DOCX files (using mammoth)
 */

const fs = require('fs');

// Polyfill for pdf-parse (fixes DOMMatrix is not defined error in Node.js)
if (!global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix { };
}

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
        const buffer = fs.readFileSync(file.path);

        if (file.mimetype === 'application/pdf') {
            return await parsePdf(buffer);
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
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Failed to parse resume: ${error.message}`);
    }
};

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const parsePdf = async (buffer) => {
    try {
        const data = await pdf(buffer);
        return cleanText(data.text);
    } catch (error) {
        throw new Error('Could not parse PDF file');
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
