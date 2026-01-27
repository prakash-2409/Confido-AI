/**
 * ML Service Integration
 * 
 * Communicates with the Python FastAPI ML Service
 */

const axios = require('axios');
const config = require('../config/env');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Call ML service to analyze resume against a job description
 * @param {string} resumeText - Extracted text from resume
 * @param {string} jobDescription - Job description text
 * @returns {Promise<Object>} - Analysis results (score, keywords)
 */
const analyzeResume = async (resumeText, jobDescription) => {
    try {
        const response = await axios.post(`${config.mlService.url}/analyze`, {
            resume_text: resumeText,
            job_description: jobDescription,
        });

        return response.data;
    } catch (error) {
        console.error('ML Service Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            throw new ApiError(503, 'ML Service is unavailable. Please try again later.');
        }

        throw new ApiError(500, 'Failed to analyze resume');
    }
};

/**
 * Check ML service health
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
    try {
        const response = await axios.get(`${config.mlService.url}/`);
        return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
        return false;
    }
};

module.exports = {
    analyzeResume,
    checkHealth,
};
