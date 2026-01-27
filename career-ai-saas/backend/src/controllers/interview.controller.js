/**
 * Interview Controller
 * 
 * Handles interview sessions:
 * - Create Session (Generate Questions)
 * - Submit Answer
 * - Get Results
 */

const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const { generateQuestions } = require('../services/questionService');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Start a new interview session
 * POST /api/v1/interview/start
 * Body: { resumeId, jobTitle, jobDescription }
 */
const startInterview = async (req, res, next) => {
    try {
        const { resumeId, jobTitle, jobDescription } = req.body;

        if (!resumeId || !jobTitle || !jobDescription) {
            throw new ApiError(400, 'Missing required fields: resumeId, jobTitle, jobDescription');
        }

        // 1. Get Resume
        const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
        if (!resume) {
            throw new ApiError(404, 'Resume not found');
        }

        // 2. Generate Questions
        // In a real app, we'd pass the JD and extraction text to an LLM here
        const questions = generateQuestions(resume, jobDescription, jobTitle);

        // 3. Create Session
        const interview = await Interview.create({
            user: req.user._id,
            resume: resume._id,
            jobTitle,
            jobDescription,
            questions,
            status: 'in_progress',
        });

        res.status(201).json({
            success: true,
            message: 'Interview session started',
            data: {
                interviewId: interview._id,
                questions: interview.questions.map(q => ({
                    id: q.id,
                    text: q.text,
                    category: q.category,
                })),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Submit an answer
 * POST /api/v1/interview/:id/answer
 * Body: { questionId, answer }
 */
const submitAnswer = async (req, res, next) => {
    try {
        const { questionId, answer } = req.body;
        const interviewId = req.params.id;

        const interview = await Interview.findOne({ _id: interviewId, user: req.user._id });
        if (!interview) {
            throw new ApiError(404, 'Interview session not found');
        }

        if (interview.status === 'completed') {
            throw new ApiError(400, 'Interview is already completed');
        }

        // Find question
        const question = interview.questions.find(q => q.id === questionId);
        if (!question) {
            throw new ApiError(404, 'Question not found in this session');
        }

        // Prepare evaluation (Simulated ML Score for now)
        // In next iteration: Call ML Service to evaluate
        const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100
        const mockFeedback = "Good answer! You covered the key concepts.";

        // Save answer
        interview.answers.push({
            questionId,
            questionText: question.text,
            userAnswer: answer,
            score: mockScore,
            feedback: mockFeedback,
        });

        await interview.save();

        res.status(200).json({
            success: true,
            message: 'Answer submitted',
            data: {
                score: mockScore,
                feedback: mockFeedback,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * End interview and get final report
 * POST /api/v1/interview/:id/end
 */
const endInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
        if (!interview) {
            throw new ApiError(404, 'Interview not found');
        }

        // Calculate aggregated stats
        const totalScore = interview.answers.reduce((sum, a) => sum + a.score, 0);
        const avgScore = interview.answers.length > 0 ? Math.round(totalScore / interview.answers.length) : 0;

        interview.status = 'completed';
        interview.completedAt = new Date();
        interview.overallScore = avgScore;
        interview.overallFeedback = avgScore > 80 ? "Excellent performance!" : "Good effort, keep practicing.";

        await interview.save();

        res.status(200).json({
            success: true,
            data: {
                interview,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    startInterview,
    submitAnswer,
    endInterview,
};
