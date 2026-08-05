const axios = require('axios');
const config = require('../config/env');

/**
 * Perform semantic matching against a job description
 * @param {string} resumeText - Unstructured resume text
 * @param {string} jobDescription - Job description text
 * @param {Array<string>} skills - Extracted candidate skills
 * @returns {Promise<Object>} - Semantic similarity metrics
 */
const matchSemantically = async (resumeText, jobDescription, skills = []) => {
    try {
        const response = await axios.post(`${config.mlService.url}/resume/semantic-match`, {
            resume_text: resumeText,
            job_description: jobDescription,
            skills
        }, { timeout: 8000 });

        return response.data;
    } catch (error) {
        console.warn('⚠️ FastAPI semantic matcher failed or offline, falling back to local JS matching.');
        return _localJSAlternativeMatch(resumeText, jobDescription, skills);
    }
};

/**
 * Local JS matcher fallback if Python service is offline
 */
const _localJSAlternativeMatch = (resumeText, jobDescription, skills) => {
    const jdLower = jobDescription.toLowerCase();
    const rLower = resumeText.toLowerCase();

    // Map common alternative concepts
    const mappings = {
        'fastapi': 'rest apis',
        'express': 'rest apis',
        'react': 'frontend development',
        'docker': 'containerization',
        'aws': 'cloud infrastructure',
        'postgresql': 'sql'
    };

    const hiddenSkills = [];
    const alternativeSkills = {};

    skills.forEach(skill => {
        const sLower = skill.toLowerCase();
        if (mappings[sLower] && jdLower.includes(mappings[sLower])) {
            hiddenSkills.push(`Mapped candidate '${skill}' to JD requirement '${mappings[sLower]}'`);
            alternativeSkills[mappings[sLower]] = skill;
        }
    });

    // Heuristic percentage calculations
    const words = jdLower.split(/\s+/).filter(w => w.length > 4);
    let matches = 0;
    words.forEach(word => {
        if (rLower.includes(word)) matches++;
    });

    const exactMatchPct = Math.round((matches / Math.max(1, words.length)) * 100);
    const semanticMatchPct = Math.min(100, exactMatchPct + (hiddenSkills.length * 5) + 12);

    return {
        semantic_match_pct: semanticMatchPct,
        exact_match_pct: exactMatchPct,
        hidden_skills: hiddenSkills,
        alternative_skills: alternativeSkills
    };
};

module.exports = {
    matchSemantically
};
