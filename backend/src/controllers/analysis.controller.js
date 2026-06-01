/**
 * ATS Analysis Controller
 * 
 * Handles resume analysis requests
 */

const Resume = require('../models/Resume');
const User = require('../models/User');
const { analyzeResume, getResumeSuggestions: mlGetSuggestions } = require('../services/mlService');
const { ApiError } = require('../middlewares/errorHandler');
const { updateCareerReadiness } = require('../services/readinessEngine');

const COMMON_SKILLS = [
    'react', 'node', 'javascript', 'python', 'aws', 'docker', 'typescript', 'mongodb', 
    'sql', 'java', 'c++', 'go', 'rust', 'project management', 'agile', 'kubernetes', 
    'css', 'html', 'rest api', 'graphql', 'machine learning', 'data analysis', 'git', 
    'ci/cd', 'redux', 'express', 'next.js', 'vue', 'angular', 'fastapi', 'django', 
    'flask', 'spring boot', 'microservices', 'devops', 'linux', 'cloud', 'security'
];

function localATSScore(resumeText, jobDescription) {
    const resumeLower = resumeText.toLowerCase();
    const jdLower = jobDescription.toLowerCase();
    
    // Find skills mentioned in JD
    const jdSkills = COMMON_SKILLS.filter(skill => jdLower.includes(skill));
    
    if (jdSkills.length === 0) {
        return {
            score: 70,
            matched_keywords: [],
            missing_keywords: [],
            summary: "Analysis complete. Add more technical keywords to your resume to align better with the job description."
        };
    }
    
    const matched = [];
    const missing = [];
    
    jdSkills.forEach(skill => {
        if (resumeLower.includes(skill)) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }
    });
    
    const score = Math.round((matched.length / jdSkills.length) * 100);
    
    return {
        score,
        matched_keywords: matched,
        missing_keywords: missing,
        summary: `Local ATS scan matched ${matched.length} out of ${jdSkills.length} key skills identified in the job description. Recommended additions: ${missing.slice(0, 3).join(', ')}.`
    };
}

function localSuggestions(resumeText, jobDescription) {
    const { score, matched_keywords, missing_keywords } = localATSScore(resumeText, jobDescription);
    const suggestions = [
        "Include more quantifiable achievements (e.g., 'Improved database query efficiency by 40%').",
        "Tailor your profile summary to directly match the target role.",
        "Ensure your contact details and LinkedIn profile link are clearly visible at the top."
    ];
    if (missing_keywords.length > 0) {
        suggestions.unshift(`Add missing skills: ${missing_keywords.join(', ')} to your skills section if you have experience with them.`);
    }
    return suggestions;
}

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

        // 2. Call ML Service with local fallback
        let analysis;
        try {
            analysis = await analyzeResume(resume.extractedText, jobDescription);
        } catch (mlError) {
            console.warn('⚠️ ML Service failed, falling back to local ATS analysis:', mlError.message);
            analysis = localATSScore(resume.extractedText, jobDescription);
        }

        // 3. Update Resume with results
        resume.atsScore = analysis.score;
        resume.skills = analysis.matched_keywords;
        resume.missingKeywords = analysis.missing_keywords;
        resume.status = 'analyzed';
        await resume.save();

        // 3.5 Extract and categorize missing keywords
        const missing = analysis.missing_keywords || [];
        const formattedMissing = missing.map(skill => {
            const skillLower = skill.toLowerCase();
            const isCritical = COMMON_SKILLS.some(cSkill => skillLower.includes(cSkill) || cSkill.includes(skillLower));
            return {
                skillName: skill,
                importance: isCritical ? 'critical' : 'important',
                sourceResumeId: resume._id,
                addedAt: new Date()
            };
        });

        // Update User missingSkills
        const user = await User.findById(req.user._id);
        if (user) {
            // Remove previous missing skills from this resume
            user.missingSkills = user.missingSkills.filter(
                s => s.sourceResumeId?.toString() !== resume._id.toString()
            );
            user.missingSkills.push(...formattedMissing);
            await user.save();
        }

        // Trigger readiness score update
        await updateCareerReadiness(req.user._id);

        // 4. Return results (wrapped in 'analysis' key for frontend compatibility)
        res.status(200).json({
            success: true,
            data: {
                analysis: {
                    score: analysis.score,
                    matchedKeywords: analysis.matched_keywords,
                    missingKeywords: analysis.missing_keywords,
                    summary: analysis.summary,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get AI-powered resume improvement suggestions
 * POST /api/v1/resume/suggestions
 * Body: { resume_text: "...", job_description: "...", target_role?: "..." }
 */
const getResumeSuggestions = async (req, res, next) => {
    try {
        const { resume_text, job_description, target_role } = req.body;

        if (!resume_text || resume_text.length < 50) {
            throw new ApiError(400, 'Please provide resume text (min 50 chars)');
        }
        if (!job_description || job_description.length < 50) {
            throw new ApiError(400, 'Please provide a job description (min 50 chars)');
        }

        let suggestions;
        try {
            suggestions = await mlGetSuggestions({
                resumeText: resume_text,
                jobDescription: job_description,
                targetRole: target_role || '',
            });
        } catch (mlError) {
            console.warn('⚠️ ML Service failed, falling back to local suggestions:', mlError.message);
            suggestions = localSuggestions(resume_text, job_description);
        }

        res.status(200).json({
            success: true,
            data: { suggestions },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    analyzeResumeAgainstJob,
    getResumeSuggestions,
};
