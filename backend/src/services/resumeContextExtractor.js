/**
 * Resume Context Extractor Service
 *
 * Extracts structured context from resume text for Round 2 (Resume Deep Dive) personalization
 * Uses ML service with LLM to parse projects, technologies, and achievements
 */

const mlService = require('./mlService');
const logger = require('../config/logger');

/**
 * Extract structured context from resume text
 * @param {string} resumeText - Extracted text from resume
 * @param {Object} user - User object for context
 * @returns {Object} Structured resume context
 */
const extractResumeContext = async (resumeText) => {
    try {
        // Validate input
        if (!resumeText || resumeText.trim().length < 50) {
            logger.warn('Resume text too short for context extraction');
            return getDefaultResumeContext();
        }

        // Call ML service to extract context using LLM
        logger.info('Calling ML service to extract resume context');
        const context = await mlService.extractResumeContext(resumeText);

        // Validate extracted context
        if (!context || !context.projects || !context.skills) {
            logger.warn('ML service returned invalid context, using fallback');
            return getFallbackContext(resumeText);
        }

        logger.info(`Successfully extracted resume context: ${context.projects.length} projects, ${context.skills.length} skills`);
        return context;

    } catch (error) {
        logger.error('Error extracting resume context:', error);

        // Fallback to rule-based extraction if ML service fails
        logger.info('Falling back to rule-based extraction');
        return getFallbackContext(resumeText);
    }
};

/**
 * Fallback: Rule-based context extraction when ML service is unavailable
 * @param {string} resumeText - Resume text
 * @returns {Object} Basic structured context
 */
const getFallbackContext = (resumeText) => {
    const context = {
        projects: [],
        skills: [],
        achievements: [],
    };

    try {
        // Extract technologies/skills using keyword matching
        const techKeywords = [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
            'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'FastAPI',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'DynamoDB', 'Cassandra',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD',
            'REST API', 'GraphQL', 'Microservices', 'Machine Learning', 'AI', 'NLP',
            'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Material-UI',
            'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
        ];

        // Find skills in resume text
        techKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            if (regex.test(resumeText)) {
                context.skills.push(keyword);
            }
        });

        // Extract projects (look for project headings and descriptions)
        const projectMatches = resumeText.match(/projects?:?\s+(.*?)(?=(education|experience|skills|$))/gis);
        if (projectMatches && projectMatches[0]) {
            const projectSection = projectMatches[0];
            const projectLines = projectSection.split('\n').filter(line => line.trim().length > 20);

            // Simple heuristic: Extract first few sentences as project descriptions
            projectLines.slice(0, 3).forEach((line, index) => {
                context.projects.push({
                    name: `Project ${index + 1}`,
                    description: line.trim().substring(0, 150),
                    technologies: context.skills.slice(0, 3), // Associate with detected skills
                });
            });
        }

        // Extract achievements (look for numbers, percentages, metrics)
        const achievementPattern = /(?:improved|increased|reduced|optimized|built|developed|led|managed).*?(?:\d+%|\d+x|$)/gi;
        const achievements = resumeText.match(achievementPattern);
        if (achievements) {
            context.achievements = achievements.slice(0, 3).map(a => a.trim());
        }

        logger.info(`Fallback extraction completed: ${context.projects.length} projects, ${context.skills.length} skills`);

    } catch (error) {
        logger.error('Error in fallback context extraction:', error);
    }

    return context;
};

/**
 * Default resume context when extraction fails completely
 * @returns {Object} Empty context structure
 */
const getDefaultResumeContext = () => {
    return {
        projects: [],
        skills: [],
        achievements: [],
    };
};

/**
 * Validate if resume context has sufficient information for Round 2
 * @param {Object} context - Resume context
 * @returns {boolean} True if context is sufficient
 */
const hasS

ufficientContext = (context) => {
    // Need at least 2 skills or 1 project for meaningful Round 2 questions
    return (
        (context.skills && context.skills.length >= 2) ||
        (context.projects && context.projects.length >= 1)
    );
};

module.exports = {
    extractResumeContext,
    getFallbackContext,
    getDefaultResumeContext,
    hasSufficientContext,
};
