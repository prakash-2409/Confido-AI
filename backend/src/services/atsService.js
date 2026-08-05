/**
 * ATS Analysis Service
 * 
 * Analyzes resume content and formatting, computes section scores,
 * and outputs actionable improvement fixes with score impact forecasts.
 */

const BUZZWORDS = ['team player', 'motivated', 'hardworking', 'go-getter', 'detail-oriented', 'synergy', 'dynamic', 'self-starter'];

/**
 * Performs deep ATS analysis of resume text
 * @param {Object} parsedResume - Parsed structured resume data
 * @param {string} rawText - Unstructured text from resume
 * @param {Array<string>} targetSkills - Skills required for target role
 * @returns {Object} - Complete ATS Analysis Report
 */
const analyzeResumeAts = (parsedResume, rawText, targetSkills = []) => {
    const textLower = rawText.toLowerCase();
    
    // 1. Calculate Section Scores
    const headerScore = parsedResume.personal?.email && parsedResume.personal?.phone ? 95 : 50;
    const summaryScore = parsedResume.personal?.summary || textLower.includes('summary') || textLower.includes('objective') ? 90 : 30;
    const experienceScore = parsedResume.experience?.length > 0 ? 85 : 40;
    const projectsScore = parsedResume.projects?.length > 0 ? 90 : 30;
    const skillsScore = parsedResume.skills?.length > 0 ? 95 : 30;
    const educationScore = parsedResume.education?.length > 0 ? 90 : 30;
    const achievementsScore = parsedResume.achievements?.length > 0 ? 85 : 40;

    // 2. Formatting & Grammar Checks
    const wordCount = rawText.split(/\s+/).length;
    const isLengthOptimal = wordCount >= 300 && wordCount <= 800; // ~1-2 pages
    const formattingScore = isLengthOptimal ? 95 : 70;

    // Bullet quality & Metrics usage
    const bullets = rawText.split('\n').filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    let metricsCount = 0;
    let weakBulletCount = 0;

    bullets.forEach(bullet => {
        // Look for numbers/percentages
        if (/\d+%|\b\d+\b\s*(?:users|servers|percent|speed|queries)/i.test(bullet)) {
            metricsCount++;
        }
        const words = bullet.split(/\s+/).length;
        if (words < 6 || words > 30) {
            weakBulletCount++;
        }
    });

    const bulletQualityScore = bullets.length > 0 ? Math.round(((bullets.length - weakBulletCount) / bullets.length) * 100) : 75;
    const metricsUsageScore = bullets.length > 0 ? Math.round((metricsCount / bullets.length) * 100) : 40;

    // Check for duplicate skills & weak buzzwords
    const detectedBuzzwords = [];
    BUZZWORDS.forEach(word => {
        if (textLower.includes(word)) {
            detectedBuzzwords.push(word);
        }
    });

    const uniqueSkills = new Set(parsedResume.skills || []);
    const duplicateSkills = (parsedResume.skills || []).length - uniqueSkills.size;

    // 3. Keyword matching & gaps
    const missingKeywords = [];
    targetSkills.forEach(skill => {
        if (!textLower.includes(skill.toLowerCase())) {
            missingKeywords.push(skill);
        }
    });

    // 4. Calculate Overall ATS Score
    const overallAtsScore = Math.round(
        (headerScore * 0.1) +
        (summaryScore * 0.1) +
        (experienceScore * 0.2) +
        (projectsScore * 0.2) +
        (skillsScore * 0.15) +
        (educationScore * 0.1) +
        (formattingScore * 0.05) +
        (bulletQualityScore * 0.05) +
        (achievementsScore * 0.05)
    );

    // 5. Formulate action items and expected score increases
    const priorityFixes = [];
    if (headerScore < 80) {
        priorityFixes.push({
            action: 'Add phone number or professional LinkedIn profile link to header',
            importance: 'critical',
            expectedIncrease: 6,
            before: 'No LinkedIn link',
            after: 'linkedin.com/in/username'
        });
    }
    if (summaryScore < 70) {
        priorityFixes.push({
            action: 'Write a strong professional summary highlighting target role keyword alignment',
            importance: 'important',
            expectedIncrease: 8,
            before: 'No summary block',
            after: 'Results-driven software engineer experienced in building REST APIs...'
        });
    }
    if (detectedBuzzwords.length > 0) {
        priorityFixes.push({
            action: `Remove generic buzzwords: ${detectedBuzzwords.slice(0, 3).join(', ')}`,
            importance: 'nice_to_have',
            expectedIncrease: 3,
            before: `I am a highly motivated team player...`,
            after: `Experienced backend developer with expertise in Django...`
        });
    }
    if (metricsUsageScore < 50) {
        priorityFixes.push({
            action: 'Quantify project achievements with concrete percentages and performance metrics',
            importance: 'critical',
            expectedIncrease: 7,
            before: 'Optimized database queries for the backend.',
            after: 'Optimized database index query speed, reducing page load latency by 28%.'
        });
    }
    if (missingKeywords.length > 0) {
        priorityFixes.push({
            action: `Add missing target skill keywords: ${missingKeywords.slice(0, 2).join(', ')}`,
            importance: 'critical',
            expectedIncrease: 10,
            before: 'Missing tech alignment',
            after: `Proficient in building systems using ${missingKeywords.slice(0, 2).join(' and ')}.`
        });
    }

    return {
        overallAtsScore,
        sectionScores: {
            header: headerScore,
            summary: summaryScore,
            experience: experienceScore,
            projects: projectsScore,
            skills: skillsScore,
            education: educationScore,
            achievements: achievementsScore,
            formatting: formattingScore
        },
        formatting: {
            wordCount,
            resumeLength: wordCount < 300 ? 'Too short' : wordCount > 900 ? 'Too long' : 'Optimal (1-2 pages)',
            bulletQuality: bulletQualityScore,
            metricsUsage: metricsUsageScore,
            buzzwordsFound: detectedBuzzwords,
            duplicateSkillsCount: duplicateSkills
        },
        missingKeywords,
        priorityFixes
    };
};

module.exports = {
    analyzeResumeAts
};
