/**
 * Interview Controller
 * 
 * Handles interview sessions:
 * - Start new interview session
 * - Get interview details
 * - Get interview history
 * - Submit answers with ML evaluation
 * - Complete interview with summary generation
 */

const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const { generateQuestions, extractSkillsFromJD } = require('../services/questionService');
const { evaluateInterviewAnswer, generateInterviewSummary } = require('../services/mlService');
const { ApiError } = require('../middlewares/errorHandler');

// ============================================================
// RESPONSE FORMATTER
// ============================================================

/**
 * Transform interview document into shape the frontend expects
 * @param {Object} interview - Mongoose Interview document
 * @param {boolean} includeDetails - Include questions, answers, summary details
 * @returns {Object} Formatted interview
 */
const formatInterviewForClient = (interview, includeDetails = false) => {
    const base = {
        _id: interview._id,
        title: `${interview.jobRole} Interview`,
        targetRole: interview.jobRole,
        difficulty: interview.difficulty || 'medium',
        status: interview.status,
        totalQuestions: interview.totalQuestions,
        answeredQuestions: interview.answers ? interview.answers.length : 0,
        overallScore: interview.summary?.overallScore || null,
        createdAt: interview.startedAt || interview.createdAt,
        completedAt: interview.completedAt || null,
    };

    if (includeDetails) {
        // Merge answers into questions so frontend gets questions[].userAnswer, .score, .feedback
        base.questions = interview.questions.map(q => {
            const answer = interview.answers?.find(a => a.questionId === q.id);
            return {
                _id: q.id,
                questionText: q.questionText,
                category: q.category,
                difficulty: q.difficulty || 'medium',
                userAnswer: answer?.answerText || null,
                score: answer?.score || null,
                feedback: answer?.feedback || null,
                answeredAt: answer?.answeredAt || null,
            };
        });

        // Transform categoryScores from object { behavioral: N } to array [{ category, score, ... }]
        if (interview.summary?.categoryScores) {
            const cs = interview.summary.categoryScores.toObject
                ? interview.summary.categoryScores.toObject()
                : interview.summary.categoryScores;
            base.categoryScores = Object.entries(cs)
                .filter(([, score]) => score !== null && score !== undefined)
                .map(([category, score]) => {
                    const catAnswers = interview.answers?.filter(a => a.category === category) || [];
                    const catQuestions = interview.questions?.filter(q => q.category === category) || [];
                    return {
                        category,
                        score,
                        totalQuestions: catQuestions.length,
                        answeredQuestions: catAnswers.length,
                    };
                });
        } else {
            base.categoryScores = [];
        }

        base.strengths = interview.summary?.strongAreas || [];
        base.weaknesses = interview.summary?.weakAreas || [];
        base.recommendations = interview.summary?.recommendations || [];
    }

    return base;
};

// ============================================================
// START INTERVIEW
// ============================================================

/**
 * Start a new interview session
 * POST /api/v1/interview/start  OR  POST /api/v1/interview
 * Body: { targetRole OR jobRole, difficulty?, jobDescription?, resumeId? }
 */
const startInterview = async (req, res, next) => {
    try {
        // Accept both frontend field names (targetRole) and backend field names (jobRole)
        const jobRole = req.body.targetRole || req.body.jobRole;
        const difficulty = req.body.difficulty || 'medium';
        const jobDescription = req.body.jobDescription || `${jobRole} position requiring relevant skills and experience in ${jobRole}.`;
        const { resumeId } = req.body;

        // Validation
        if (!jobRole) {
            throw new ApiError(400, 'Missing required field: targetRole (or jobRole)');
        }

        // Optional: Get resume if provided
        let resume = null;
        if (resumeId) {
            resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
            if (!resume) {
                throw new ApiError(404, 'Resume not found');
            }
        }

        // Generate questions based on job role and description
        const { questions, extractedSkills } = generateQuestions(jobRole, jobDescription, 8);

        if (questions.length === 0) {
            throw new ApiError(500, 'Failed to generate interview questions');
        }

        // Create interview session
        const interview = await Interview.create({
            user: req.user._id,
            resume: resume?._id || null,
            jobRole,
            jobDescription,
            difficulty,
            extractedSkills,
            questions,
            totalQuestions: questions.length,
            status: 'in_progress',
            currentQuestionIndex: 0,
        });

        // Return interview data in shape the frontend expects
        const formatted = formatInterviewForClient(interview, true);
        res.status(201).json({
            success: true,
            message: 'Interview session started successfully',
            data: {
                interview: formatted,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// GET INTERVIEW DETAILS
// ============================================================

/**
 * Get interview session details
 * GET /api/v1/interview/:id
 */
const getInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('resume', 'originalName atsScore');

        if (!interview) {
            throw new ApiError(404, 'Interview session not found');
        }

        const formatted = formatInterviewForClient(interview, true);

        res.status(200).json({
            success: true,
            data: {
                interview: formatted,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// GET INTERVIEW HISTORY
// ============================================================

/**
 * Get user's interview history
 * GET /api/v1/interview/history
 * Query: { status?, limit?, page? }
 */
const getInterviewHistory = async (req, res, next) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;
        
        // Build query
        const query = { user: req.user._id };
        if (status && ['in_progress', 'completed'].includes(status)) {
            query.status = status;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get interviews
        const [interviews, total] = await Promise.all([
            Interview.find(query)
                .select('jobRole status totalQuestions answers summary.overallScore summary.readinessLevel startedAt completedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Interview.countDocuments(query)
        ]);

        // Format response to match frontend expectations
        const formattedInterviews = interviews.map(interview => formatInterviewForClient(interview, false));

        res.status(200).json({
            success: true,
            data: {
                interviews: formattedInterviews,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// SUBMIT ANSWER
// ============================================================

/**
 * Submit an answer for the current question
 * POST /api/v1/interview/:id/answer
 * Body: { questionId, answerText }
 */
const submitAnswer = async (req, res, next) => {
    try {
        // Accept both 'answer' (frontend) and 'answerText' (backend) field names
        const { questionId } = req.body;
        const answerText = req.body.answer || req.body.answerText;
        const interviewId = req.params.id;

        // Validation
        if (!questionId || !answerText) {
            throw new ApiError(400, 'Missing required fields: questionId and answerText');
        }

        if (answerText.trim().length < 20) {
            throw new ApiError(400, 'Answer is too short. Please provide a more detailed response.');
        }

        // Get interview
        const interview = await Interview.findOne({
            _id: interviewId,
            user: req.user._id
        });

        if (!interview) {
            throw new ApiError(404, 'Interview session not found');
        }

        if (interview.status === 'completed') {
            throw new ApiError(400, 'Interview is already completed');
        }

        // Find the question
        const question = interview.questions.find(q => q.id === questionId);
        if (!question) {
            throw new ApiError(404, 'Question not found in this interview session');
        }

        // Check if already answered
        const existingAnswer = interview.answers.find(a => a.questionId === questionId);
        if (existingAnswer) {
            throw new ApiError(400, 'This question has already been answered');
        }

        // Evaluate answer using ML service
        let evaluation;
        try {
            evaluation = await evaluateInterviewAnswer({
                questionText: question.questionText,
                category: question.category,
                answerText: answerText.trim(),
                expectedKeywords: question.expectedKeywords || [],
                jobRole: interview.jobRole,
                jobDescription: interview.jobDescription
            });
        } catch (mlError) {
            console.error('ML evaluation failed, using fallback:', mlError.message);
            // Fallback evaluation if ML service is unavailable
            evaluation = {
                score: 65,
                feedback: 'Answer recorded. Detailed evaluation temporarily unavailable.',
                strengths: ['Answer submitted successfully'],
                improvements: ['ML evaluation service temporarily unavailable'],
                keywordsFound: [],
                keywordsMissed: []
            };
        }

        // Save the answer
        interview.answers.push({
            questionId,
            questionText: question.questionText,
            category: question.category,
            answerText: answerText.trim(),
            score: evaluation.score,
            feedback: evaluation.feedback,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            keywordsFound: evaluation.keywordsFound,
            keywordsMissed: evaluation.keywordsMissed,
            answeredAt: new Date()
        });

        // Update current question index
        interview.currentQuestionIndex = interview.answers.length;

        await interview.save();

        // Check if there are more questions
        const hasMoreQuestions = interview.answers.length < interview.questions.length;

        // Re-fetch and format the full interview for the frontend
        const updatedInterview = await Interview.findById(interview._id);
        const formatted = formatInterviewForClient(updatedInterview, true);

        // Also return the updated question with its answer
        const answeredQuestion = {
            _id: questionId,
            questionText: question.questionText,
            category: question.category,
            score: evaluation.score,
            feedback: evaluation.feedback,
            userAnswer: answerText.trim(),
        };

        res.status(200).json({
            success: true,
            message: 'Answer submitted successfully',
            data: {
                question: answeredQuestion,
                interview: formatted,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// COMPLETE INTERVIEW
// ============================================================

/**
 * Complete the interview and generate summary
 * POST /api/v1/interview/:id/complete
 */
const completeInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!interview) {
            throw new ApiError(404, 'Interview session not found');
        }

        if (interview.status === 'completed') {
            throw new ApiError(400, 'Interview is already completed');
        }

        if (interview.answers.length === 0) {
            throw new ApiError(400, 'Please answer at least one question before completing');
        }

        // Generate summary using ML service
        let summary;
        try {
            summary = await generateInterviewSummary({
                jobRole: interview.jobRole,
                jobDescription: interview.jobDescription,
                answers: interview.answers.map(a => ({
                    category: a.category,
                    score: a.score,
                    strengths: a.strengths,
                    improvements: a.improvements
                }))
            });
        } catch (mlError) {
            console.error('ML summary generation failed, using fallback:', mlError.message);
            // Fallback summary calculation
            const totalScore = interview.answers.reduce((sum, a) => sum + (a.score || 0), 0);
            const avgScore = Math.round(totalScore / interview.answers.length);
            
            // Calculate category scores
            const categoryScores = { behavioral: null, technical: null, situational: null };
            for (const cat of Object.keys(categoryScores)) {
                const catAnswers = interview.answers.filter(a => a.category === cat);
                if (catAnswers.length > 0) {
                    categoryScores[cat] = Math.round(
                        catAnswers.reduce((sum, a) => sum + (a.score || 0), 0) / catAnswers.length
                    );
                }
            }

            let readinessLevel = 'Low';
            if (avgScore >= 80) readinessLevel = 'High';
            else if (avgScore >= 60) readinessLevel = 'Medium';

            summary = {
                overallScore: avgScore,
                readinessLevel,
                strongAreas: avgScore >= 70 ? ['Completed all questions'] : [],
                weakAreas: avgScore < 70 ? ['Room for improvement'] : [],
                categoryScores,
                recommendations: ['Practice with more mock interviews'],
                feedbackSummary: `Interview completed with ${avgScore}% score. ${readinessLevel} readiness for ${interview.jobRole}.`
            };
        }

        // Update interview with summary
        interview.status = 'completed';
        interview.completedAt = new Date();
        interview.summary = {
            overallScore: summary.overallScore,
            readinessLevel: summary.readinessLevel,
            strongAreas: summary.strongAreas,
            weakAreas: summary.weakAreas,
            categoryScores: summary.categoryScores,
            recommendations: summary.recommendations,
            feedbackSummary: summary.feedbackSummary
        };

        await interview.save();

        // Re-fetch and return formatted interview
        const updatedInterview = await Interview.findById(interview._id);
        const formatted = formatInterviewForClient(updatedInterview, true);

        res.status(200).json({
            success: true,
            message: 'Interview completed successfully',
            data: {
                interview: formatted,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    startInterview,
    getInterview,
    getInterviewHistory,
    submitAnswer,
    completeInterview,
};
