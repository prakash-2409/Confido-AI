/**
 * ML Service Integration
 * 
 * Communicates with the Python FastAPI ML Service for:
 * - Resume ATS Analysis
 * - Interview Answer Evaluation
 * - Interview Summary Generation
 */

const axios = require('axios');
const config = require('../config/env');
const { ApiError } = require('../middlewares/errorHandler');

// Create axios instance with default config
const mlClient = axios.create({
    baseURL: config.mlService.url,
    timeout: 30000, // 30 second timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================================
// Resume Analysis
// ============================================================

/**
 * Call ML service to analyze resume against a job description
 * @param {string} resumeText - Extracted text from resume
 * @param {string} jobDescription - Job description text
 * @returns {Promise<Object>} - Analysis results (score, keywords)
 */
const analyzeResume = async (resumeText, jobDescription) => {
    try {
        const response = await mlClient.post('/analyze', {
            resume_text: resumeText,
            job_description: jobDescription,
        });

        return response.data;
    } catch (error) {
        console.error('ML Service Error (analyzeResume):', error.message);

        if (error.code === 'ECONNREFUSED') {
            throw new ApiError(503, 'ML Service is unavailable. Please try again later.');
        }

        throw new ApiError(500, 'Failed to analyze resume');
    }
};

// ============================================================
// Interview Evaluation
// ============================================================

/**
 * Evaluate a single interview answer
 * @param {Object} params - Evaluation parameters
 * @param {string} params.questionText - The interview question
 * @param {string} params.category - Question category (behavioral/technical/situational)
 * @param {string} params.answerText - User's answer
 * @param {Array<string>} params.expectedKeywords - Keywords to look for
 * @param {string} params.jobRole - Target job role
 * @param {string} params.jobDescription - Job description
 * @returns {Promise<Object>} - Evaluation results
 */
const evaluateInterviewAnswer = async ({
    questionText,
    category,
    answerText,
    expectedKeywords = [],
    jobRole = null,
    jobDescription = null
}) => {
    try {
        const response = await mlClient.post('/interview/evaluate', {
            question_text: questionText,
            category: category,
            answer_text: answerText,
            expected_keywords: expectedKeywords,
            job_role: jobRole,
            job_description: jobDescription
        });

        // Transform snake_case to camelCase for consistency
        return {
            score: response.data.score,
            feedback: response.data.feedback,
            strengths: response.data.strengths,
            improvements: response.data.improvements,
            keywordsFound: response.data.keywords_found,
            keywordsMissed: response.data.keywords_missed
        };
    } catch (error) {
        console.error('ML Service Error (evaluateInterviewAnswer):', error.message);

        if (error.code === 'ECONNREFUSED') {
            throw new ApiError(503, 'ML Service is unavailable. Please try again later.');
        }

        if (error.response?.status === 400) {
            throw new ApiError(400, error.response.data?.detail || 'Invalid evaluation request');
        }

        throw new ApiError(500, 'Failed to evaluate interview answer');
    }
};

/**
 * Generate comprehensive interview summary
 * @param {Object} params - Summary parameters
 * @param {string} params.jobRole - Target job role
 * @param {string} params.jobDescription - Job description
 * @param {Array<Object>} params.answers - Array of answer evaluations
 * @returns {Promise<Object>} - Interview summary
 */
const generateInterviewSummary = async ({ jobRole, jobDescription, answers }) => {
    try {
        // Transform answers to match ML service expected format
        const formattedAnswers = answers.map(answer => ({
            category: answer.category,
            score: answer.score,
            strengths: answer.strengths || [],
            improvements: answer.improvements || []
        }));

        const response = await mlClient.post('/interview/summary', {
            job_role: jobRole,
            job_description: jobDescription,
            answers: formattedAnswers
        });

        // Transform snake_case to camelCase
        return {
            overallScore: response.data.overall_score,
            readinessLevel: response.data.readiness_level,
            strongAreas: response.data.strong_areas,
            weakAreas: response.data.weak_areas,
            categoryScores: response.data.category_scores,
            recommendations: response.data.recommendations,
            feedbackSummary: response.data.feedback_summary
        };
    } catch (error) {
        console.error('ML Service Error (generateInterviewSummary):', error.message);

        if (error.code === 'ECONNREFUSED') {
            throw new ApiError(503, 'ML Service is unavailable. Please try again later.');
        }

        if (error.response?.status === 400) {
            throw new ApiError(400, error.response.data?.detail || 'Invalid summary request');
        }

        throw new ApiError(500, 'Failed to generate interview summary');
    }
};

// ============================================================
// Resume Improvement Suggestions
// ============================================================

/**
 * Get AI-powered resume improvement suggestions
 * @param {Object} params
 * @param {string} params.resumeText - Extracted text from resume
 * @param {string} params.jobDescription - Job description text
 * @param {string} params.targetRole - Target job role
 * @returns {Promise<Object>} - Improvement suggestions
 */
const getResumeSuggestions = async ({ resumeText, jobDescription, targetRole }) => {
    try {
        const response = await mlClient.post('/resume/suggestions', {
            resume_text: resumeText,
            job_description: jobDescription,
            target_role: targetRole || '',
        });

        return response.data;
    } catch (error) {
        console.error('ML Service Error (getResumeSuggestions):', error.message);

        if (error.code === 'ECONNREFUSED') {
            throw new ApiError(503, 'ML Service is unavailable. Please try again later.');
        }

        throw new ApiError(500, 'Failed to generate resume suggestions');
    }
};

// ============================================================
// Health Check
// ============================================================

/**
 * Check ML service health
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
    try {
        const response = await mlClient.get('/');
        return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
        return false;
    }
};

module.exports = {
    analyzeResume,
    evaluateInterviewAnswer,
    generateInterviewSummary,
    getResumeSuggestions,
    checkHealth,
};
