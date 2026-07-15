/**
 * Job Match Intelligence Service
 * 
 * Core engine for Phase 3. Orchestrates:
 * 1. JD requirement extraction (LLM or fallback)
 * 2. Match score computation against user profile + resume
 * 3. Gap analysis with prioritized missing items
 * 4. Hiring probability calculation
 * 5. Improvement simulation (what-if analysis)
 * 6. Interview topic prediction
 * 7. Full deterministic fallback when LLM is unavailable
 */

const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const LearningRoadmap = require('../models/LearningRoadmap');
const JobMatch = require('../models/JobMatch');
const { callLLM } = require('../utils/llmClient');
const logger = require('../config/logger');

// ── Skill / Tool Dictionaries for Fallback ───────────────────────────────────

const TECH_SKILLS = new Set([
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang', 'rust',
    'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'nosql',
    'html', 'css', 'sass', 'less', 'react', 'reactjs', 'react.js', 'angular', 'angularjs',
    'vue', 'vuejs', 'vue.js', 'svelte', 'next.js', 'nextjs', 'nuxt', 'gatsby',
    'node', 'nodejs', 'node.js', 'express', 'expressjs', 'fastify', 'nestjs', 'nest.js',
    'django', 'flask', 'fastapi', 'spring', 'spring boot', 'springboot', 'rails',
    'asp.net', '.net', 'dotnet',
    'mongodb', 'mongoose', 'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch',
    'dynamodb', 'cassandra', 'firebase', 'firestore', 'supabase', 'prisma', 'sequelize',
    'graphql', 'rest', 'restful', 'api', 'grpc', 'websocket', 'websockets',
    'aws', 'azure', 'gcp', 'google cloud', 'cloud', 'serverless', 'lambda',
    'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'cicd',
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
    'machine learning', 'ml', 'deep learning', 'ai', 'artificial intelligence',
    'nlp', 'computer vision', 'data science', 'data engineering', 'data analysis',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
    'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'devops', 'sre',
    'microservices', 'monolith', 'event-driven', 'event driven',
    'linux', 'unix', 'bash', 'shell', 'powershell',
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
    'tailwind', 'tailwindcss', 'bootstrap', 'material ui', 'chakra ui', 'styled-components',
    'webpack', 'vite', 'rollup', 'babel', 'esbuild', 'parcel',
    'jest', 'mocha', 'chai', 'cypress', 'playwright', 'selenium', 'puppeteer',
    'storybook', 'chromatic',
    'stripe', 'twilio', 'sendgrid', 'auth0', 'oauth', 'jwt',
    'blockchain', 'solidity', 'web3', 'ethereum',
    'swift', 'swiftui', 'react native', 'flutter', 'dart', 'ionic', 'expo',
    'three.js', 'threejs', 'd3', 'd3.js', 'chart.js', 'highcharts',
    'nginx', 'apache', 'caddy', 'load balancing',
    'rabbitmq', 'kafka', 'sqs', 'pub/sub', 'message queue',
    'oauth2', 'saml', 'sso', 'ldap', 'openid',
]);

const SOFT_SKILLS = new Set([
    'communication', 'leadership', 'teamwork', 'collaboration', 'problem solving',
    'problem-solving', 'critical thinking', 'analytical', 'time management',
    'project management', 'mentoring', 'coaching', 'presentation',
    'negotiation', 'stakeholder management', 'cross-functional',
    'self-motivated', 'adaptable', 'flexible', 'detail-oriented',
    'strategic thinking', 'decision making', 'conflict resolution',
]);

const TOOLS_SET = new Set([
    'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'circleci',
    'github actions', 'gitlab ci', 'travis ci', 'bamboo', 'argo cd', 'argocd',
    'jira', 'confluence', 'slack', 'notion', 'trello', 'asana', 'linear',
    'figma', 'sketch', 'invision', 'zeplin', 'abstract',
    'datadog', 'new relic', 'grafana', 'prometheus', 'splunk', 'elk', 'kibana',
    'postman', 'insomnia', 'swagger', 'openapi',
    'vs code', 'vscode', 'intellij', 'webstorm', 'pycharm', 'eclipse', 'vim', 'neovim',
    'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'cloudflare',
    'sentry', 'bugsnag', 'logrocket', 'amplitude', 'mixpanel', 'segment',
    'redis', 'memcached', 'elasticsearch', 'algolia',
    'stripe', 'twilio', 'sendgrid', 'mailchimp',
    'tableau', 'power bi', 'looker', 'metabase',
]);

const EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "doctorate", "degree", "bs", "ms", "ba", "ma",
    "mba", "b.s.", "m.s.", "b.a.", "m.a.", "associate", "diploma",
    "computer science", "engineering", "information technology", "mathematics",
    "statistics", "data science", "electrical engineering", "software engineering",
];

// ── Helper: Normalize text for matching ──────────────────────────────────────

const normalize = (text) => text?.toLowerCase().trim().replace(/[^a-z0-9\s\.\+\#\-\/]/g, '') || '';

const tokenize = (text) => {
    const normalized = normalize(text);
    // Extract both single words and common multi-word phrases
    const words = normalized.split(/\s+/).filter(w => w.length > 1);
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
        bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
    const trigrams = [];
    for (let i = 0; i < words.length - 2; i++) {
        trigrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
    return new Set([...words, ...bigrams, ...trigrams]);
};

// ── 1. Extract Job Requirements ──────────────────────────────────────────────

/**
 * Uses LLM to extract structured requirements from a job description.
 * Falls back to keyword extraction when LLM is unavailable.
 * @param {string} jobDescriptionText - Raw JD text
 * @returns {Promise<Object>} Extracted requirements
 */
const extractJobRequirements = async (jobDescriptionText) => {
    const systemPrompt = `You are a precise job description parser. Extract structured requirements from the given job description.
Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "skills": ["skill1", "skill2"],
  "experience": { "minYears": 0, "maxYears": null, "level": "mid" },
  "education": ["Bachelor's in Computer Science or related field"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "tools": ["tool1", "tool2"],
  "certifications": ["cert1"]
}

Rules:
- "skills" includes both technical and soft skills mentioned
- "experience.level" must be one of: entry, junior, mid, senior, lead, principal, any
- Extract experience years from phrases like "3+ years", "5-7 years", etc.
- "tools" includes specific platforms, frameworks, and software
- Keep items concise (max 6 words each)
- Include ALL skills/tools mentioned, even if only briefly`;

    const userPrompt = `Parse this job description:\n\n${jobDescriptionText.substring(0, 4000)}`;

    try {
        const llmResponse = await callLLM(systemPrompt, userPrompt, 0.2);
        if (llmResponse) {
            // Strip markdown code blocks if present
            const cleaned = llmResponse.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                skills: Array.isArray(parsed.skills) ? parsed.skills.map(s => s.trim()) : [],
                experience: {
                    minYears: parsed.experience?.minYears ?? 0,
                    maxYears: parsed.experience?.maxYears ?? null,
                    level: parsed.experience?.level || 'any',
                },
                education: Array.isArray(parsed.education) ? parsed.education : [],
                responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
                tools: Array.isArray(parsed.tools) ? parsed.tools.map(t => t.trim()) : [],
                certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
            };
        }
    } catch (err) {
        logger.warn('LLM extraction failed, using fallback:', err.message);
    }

    // Fallback: keyword-based extraction
    return extractRequirementsFallback(jobDescriptionText);
};

/**
 * Deterministic fallback for JD requirement extraction
 */
const extractRequirementsFallback = (text) => {
    const tokens = tokenize(text);
    const normalizedText = normalize(text);

    // Extract skills
    const skills = [];
    for (const skill of TECH_SKILLS) {
        if (tokens.has(skill) || normalizedText.includes(skill)) {
            skills.push(skill);
        }
    }
    for (const skill of SOFT_SKILLS) {
        if (tokens.has(skill) || normalizedText.includes(skill)) {
            skills.push(skill);
        }
    }

    // Extract tools
    const tools = [];
    for (const tool of TOOLS_SET) {
        if (tokens.has(tool) || normalizedText.includes(tool)) {
            tools.push(tool);
        }
    }

    // Extract experience
    const expMatch = normalizedText.match(/(\d+)\+?\s*(?:to|-)\s*(\d+)?\s*years?/);
    const expSingle = normalizedText.match(/(\d+)\+?\s*years?/);
    let minYears = 0, maxYears = null;
    if (expMatch) {
        minYears = parseInt(expMatch[1], 10);
        maxYears = expMatch[2] ? parseInt(expMatch[2], 10) : null;
    } else if (expSingle) {
        minYears = parseInt(expSingle[1], 10);
    }

    // Determine level
    let level = 'any';
    if (normalizedText.includes('senior') || normalizedText.includes('sr.') || normalizedText.includes('staff')) level = 'senior';
    else if (normalizedText.includes('lead') || normalizedText.includes('principal') || normalizedText.includes('architect')) level = 'lead';
    else if (normalizedText.includes('junior') || normalizedText.includes('jr.') || normalizedText.includes('entry')) level = 'junior';
    else if (normalizedText.includes('mid-level') || normalizedText.includes('mid level') || minYears >= 2) level = 'mid';
    else if (minYears === 0) level = 'entry';

    // Extract education
    const education = [];
    for (const kw of EDUCATION_KEYWORDS) {
        if (normalizedText.includes(kw)) {
            // Find the sentence containing this keyword
            const sentenceRegex = new RegExp(`[^.]*${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.]*\\.?`, 'i');
            const match = text.match(sentenceRegex);
            if (match) {
                const sentence = match[0].trim();
                if (sentence.length > 10 && sentence.length < 200 && !education.some(e => e === sentence)) {
                    education.push(sentence);
                }
            }
        }
    }

    // Extract responsibilities (heuristic: lines starting with bullets, numbers, or dashes)
    const responsibilities = [];
    const lines = text.split(/\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (/^[\-•*▪◦]\s+/.test(trimmed) || /^\d+[\.\)]\s+/.test(trimmed)) {
            const clean = trimmed.replace(/^[\-•*▪◦\d\.\)]+\s*/, '').trim();
            if (clean.length > 15 && clean.length < 300) {
                responsibilities.push(clean);
            }
        }
    }

    return {
        skills: [...new Set(skills)],
        experience: { minYears, maxYears, level },
        education: [...new Set(education)].slice(0, 3),
        responsibilities: responsibilities.slice(0, 10),
        tools: [...new Set(tools)],
        certifications: [],
    };
};

// ── 2. Compute Match Score ───────────────────────────────────────────────────

/**
 * Computes a weighted match score comparing user data against JD requirements.
 * Weights: Skills 40%, Experience 25%, Tools 20%, Education 15%
 * @param {Object} userContext - From gatherUserContext
 * @param {Object} requirements - Extracted JD requirements
 * @returns {Object} Match result with scores, matched/missing arrays
 */
const computeMatchScore = (userContext, requirements) => {
    const resumeSkillsNorm = new Set((userContext.resume.skills || []).map(normalize));
    const missingSkillsFromUser = new Set((userContext.user.missingSkills || []).map(s => normalize(s.skillName || s)));
    const allUserSkills = new Set([...resumeSkillsNorm, ...missingSkillsFromUser]);

    // Add roadmap completed skills
    if (userContext.roadmap?.milestones) {
        userContext.roadmap.milestones.forEach(m => {
            if (m.status === 'completed' && m.skills) {
                m.skills.forEach(s => allUserSkills.add(normalize(s)));
            }
        });
    }

    // ── Skills Score ──
    const requiredSkills = (requirements.skills || []).map(s => ({ original: s, norm: normalize(s) }));
    const matchedSkills = [];
    const missingSkills = [];
    for (const { original, norm } of requiredSkills) {
        const found = [...allUserSkills].some(us => us.includes(norm) || norm.includes(us));
        if (found) matchedSkills.push(original);
        else missingSkills.push(original);
    }
    const skillsScore = requiredSkills.length > 0
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 50; // Neutral if JD has no specific skills

    // ── Tools Score ──
    const requiredTools = (requirements.tools || []).map(t => ({ original: t, norm: normalize(t) }));
    const matchedTools = [];
    const missingTools = [];
    for (const { original, norm } of requiredTools) {
        const found = [...allUserSkills].some(us => us.includes(norm) || norm.includes(us));
        if (found) matchedTools.push(original);
        else missingTools.push(original);
    }
    const toolsScore = requiredTools.length > 0
        ? Math.round((matchedTools.length / requiredTools.length) * 100)
        : 50;

    // ── Experience Score ──
    const userYears = userContext.user.experienceYears || 0;
    const reqMin = requirements.experience?.minYears || 0;
    const reqMax = requirements.experience?.maxYears;
    let experienceScore;
    let experienceVerdict;
    if (reqMin === 0 && !reqMax) {
        experienceScore = 70; // No requirement specified
        experienceVerdict = 'unknown';
    } else if (userYears >= reqMin) {
        experienceScore = reqMax && userYears > reqMax ? 90 : 100;
        experienceVerdict = userYears > (reqMax || reqMin) ? 'exceeds' : 'meets';
    } else {
        const ratio = reqMin > 0 ? userYears / reqMin : 0;
        experienceScore = Math.round(ratio * 100);
        experienceVerdict = 'below';
    }

    // ── Education Score ──
    const reqEducation = requirements.education || [];
    let educationScore = 50; // Default neutral
    let educationVerdict = 'unknown';
    if (reqEducation.length > 0) {
        // Simple heuristic: if user has a role/profile, assume basic education met
        // More sophisticated scoring would require explicit education data on user model
        if (userContext.user.currentRole || userYears >= 2) {
            educationScore = 70;
            educationVerdict = 'meets';
        } else {
            educationScore = 40;
            educationVerdict = 'below';
        }
    }

    // ── Weighted Overall Score ──
    const overallScore = Math.round(
        (skillsScore * 0.40) +
        (experienceScore * 0.25) +
        (toolsScore * 0.20) +
        (educationScore * 0.15)
    );

    return {
        overallScore: Math.min(100, Math.max(0, overallScore)),
        categoryScores: {
            skills: skillsScore,
            experience: experienceScore,
            tools: toolsScore,
            education: educationScore,
        },
        matchedSkills,
        missingSkills,
        matchedTools,
        missingTools,
        experienceMatch: {
            required: reqMin > 0 ? `${reqMin}${reqMax ? '-' + reqMax : '+'} years` : 'Not specified',
            actual: `${userYears} years`,
            verdict: experienceVerdict,
        },
        educationMatch: {
            required: reqEducation.length > 0 ? reqEducation : ['Not specified'],
            actual: userContext.user.currentRole || 'Not specified',
            verdict: educationVerdict,
        },
    };
};

// ── 3. Generate Gap Analysis ─────────────────────────────────────────────────

/**
 * Produces a prioritized gap analysis from match results.
 * Cross-references roadmap and interview data for deeper insights.
 * @param {Object} matchResult
 * @param {Object} userContext
 * @param {Object} requirements
 * @returns {Object} Gap analysis
 */
const generateGapAnalysis = (matchResult, userContext, requirements) => {
    // ── Missing Skills with importance ──
    const criticalThreshold = Math.ceil(matchResult.missingSkills.length * 0.3);
    const missingSkillsAnalysis = matchResult.missingSkills.map((skill, idx) => {
        let importance = 'nice_to_have';
        if (idx < criticalThreshold) importance = 'critical';
        else if (idx < criticalThreshold * 2) importance = 'important';

        // Estimate learning time based on complexity
        const norm = normalize(skill);
        let estimatedLearningTime = '1-2 weeks';
        const complexSkills = ['machine learning', 'kubernetes', 'system design', 'distributed systems', 'blockchain'];
        const mediumSkills = ['docker', 'graphql', 'typescript', 'aws', 'azure', 'gcp'];
        if (complexSkills.some(cs => norm.includes(cs))) estimatedLearningTime = '1-3 months';
        else if (mediumSkills.some(ms => norm.includes(ms))) estimatedLearningTime = '2-4 weeks';

        return { skill, importance, estimatedLearningTime };
    });

    // ── Missing Technologies ──
    const missingTechnologies = matchResult.missingTools.map((tech, idx) => ({
        tech,
        importance: idx < 2 ? 'critical' : 'important',
    }));

    // ── Missing Experience (cross-reference with interview weak areas) ──
    const missingExperience = [];
    const interviewWeaknesses = userContext.interviews?.weaknesses || [];
    if (matchResult.experienceMatch.verdict === 'below') {
        missingExperience.push(`Need ${matchResult.experienceMatch.required} experience (you have ${matchResult.experienceMatch.actual})`);
    }
    if (matchResult.missingSkills.length > 3) {
        missingExperience.push(`Build projects demonstrating: ${matchResult.missingSkills.slice(0, 3).join(', ')}`);
    }
    if (requirements.responsibilities?.length > 0) {
        missingExperience.push(`Gain exposure to: ${requirements.responsibilities.slice(0, 2).join('; ')}`);
    }

    // ── Missing Interview Prep ──
    const missingInterviewPrep = [];
    if (interviewWeaknesses.length > 0) {
        missingInterviewPrep.push(`Improve weak areas: ${interviewWeaknesses.slice(0, 3).join(', ')}`);
    }
    const technicalSkills = matchResult.missingSkills.filter(s => {
        const n = normalize(s);
        return TECH_SKILLS.has(n) || [...TECH_SKILLS].some(ts => n.includes(ts));
    });
    if (technicalSkills.length > 0) {
        missingInterviewPrep.push(`Practice technical questions on: ${technicalSkills.slice(0, 3).join(', ')}`);
    }
    if (!userContext.interviews?.hasInterviews) {
        missingInterviewPrep.push('Complete at least 2-3 mock interviews to build confidence');
    }

    return {
        missingSkills: missingSkillsAnalysis,
        missingTechnologies,
        missingExperience,
        missingInterviewPrep,
    };
};

// ── 4. Compute Hiring Probability ────────────────────────────────────────────

/**
 * Maps overall match score + context signals to a hiring probability.
 * @param {Object} matchResult
 * @param {Object} gapAnalysis
 * @param {Object} userContext
 * @returns {Object} Hiring probability assessment
 */
const computeHiringProbability = (matchResult, gapAnalysis, userContext) => {
    const score = matchResult.overallScore;
    let percentage = score;
    const reasoning = [];
    const topBlockers = [];

    // Adjust based on interview performance
    if (userContext.interviews?.hasInterviews) {
        const avgInterview = userContext.interviews.averageScore;
        if (avgInterview >= 75) {
            percentage = Math.min(100, percentage + 8);
            reasoning.push(`Strong interview performance (avg ${avgInterview}%) boosts your chances`);
        } else if (avgInterview < 50) {
            percentage = Math.max(0, percentage - 10);
            topBlockers.push(`Low interview scores (avg ${avgInterview}%) — practice more mock interviews`);
        }
    } else {
        topBlockers.push('No mock interview data — complete interviews to assess readiness');
    }

    // Adjust based on roadmap completion
    if (userContext.roadmap?.hasRoadmap) {
        const completion = userContext.roadmap.completionPercentage;
        if (completion >= 70) {
            percentage = Math.min(100, percentage + 5);
            reasoning.push(`Roadmap ${completion}% complete — shows commitment to growth`);
        }
    }

    // Adjust based on resume quality
    if (userContext.resume?.hasResume) {
        const ats = userContext.resume.atsScore;
        if (ats >= 80) {
            reasoning.push(`Strong ATS resume score (${ats}%) means your resume will pass automated filters`);
        } else if (ats < 50) {
            topBlockers.push(`Low ATS score (${ats}%) — your resume may be filtered out before a human sees it`);
            percentage = Math.max(0, percentage - 5);
        }
    } else {
        topBlockers.push('No resume analyzed — upload and optimize your resume');
    }

    // Experience verdict
    if (matchResult.experienceMatch.verdict === 'below') {
        topBlockers.push(`Experience gap: ${matchResult.experienceMatch.required} required, you have ${matchResult.experienceMatch.actual}`);
        percentage = Math.max(0, percentage - 5);
    } else if (matchResult.experienceMatch.verdict === 'exceeds') {
        reasoning.push('Your experience exceeds the requirement');
    }

    // Skill gaps
    const criticalGaps = gapAnalysis.missingSkills.filter(s => s.importance === 'critical');
    if (criticalGaps.length > 0) {
        topBlockers.push(`Missing ${criticalGaps.length} critical skill(s): ${criticalGaps.map(s => s.skill).join(', ')}`);
    }

    // Skills match strength
    if (matchResult.matchedSkills.length >= matchResult.missingSkills.length) {
        reasoning.push(`You match ${matchResult.matchedSkills.length} of ${matchResult.matchedSkills.length + matchResult.missingSkills.length} required skills`);
    }

    // Determine level
    percentage = Math.min(100, Math.max(0, Math.round(percentage)));
    let level;
    if (percentage >= 70) level = 'high';
    else if (percentage >= 40) level = 'medium';
    else level = 'low';

    return {
        level,
        percentage,
        reasoning: reasoning.length > 0 ? reasoning : ['Analysis based on available profile data'],
        topBlockers: topBlockers.length > 0 ? topBlockers : ['No major blockers identified'],
    };
};

// ── 5. Simulate Improvements ─────────────────────────────────────────────────

/**
 * Generates what-if scenarios showing score impact if gaps are resolved.
 * @param {Object} matchResult
 * @param {Object} gapAnalysis
 * @returns {Array} Sorted improvement simulations
 */
const simulateImprovements = (matchResult, gapAnalysis) => {
    const currentScore = matchResult.overallScore;
    const totalSkillsCount = matchResult.matchedSkills.length + matchResult.missingSkills.length;
    const totalToolsCount = matchResult.matchedTools.length + matchResult.missingTools.length;
    const simulations = [];

    // Simulate learning each critical/important missing skill
    const importantSkills = gapAnalysis.missingSkills
        .filter(s => s.importance !== 'nice_to_have')
        .slice(0, 6);

    for (const gap of importantSkills) {
        // Calculate projected skill score if this skill is added
        const newMatchedCount = matchResult.matchedSkills.length + 1;
        const newSkillScore = totalSkillsCount > 0
            ? Math.round((newMatchedCount / totalSkillsCount) * 100)
            : matchResult.categoryScores.skills;
        const skillDelta = newSkillScore - matchResult.categoryScores.skills;
        const projectedScore = Math.min(100, currentScore + Math.round(skillDelta * 0.40));

        simulations.push({
            action: `Learn ${gap.skill} (${gap.estimatedLearningTime})`,
            currentScore,
            projectedScore,
            impact: projectedScore - currentScore,
        });
    }

    // Simulate gaining missing tools
    const importantTools = gapAnalysis.missingTechnologies
        .filter(t => t.importance === 'critical')
        .slice(0, 3);

    for (const toolGap of importantTools) {
        const newToolMatchCount = matchResult.matchedTools.length + 1;
        const newToolScore = totalToolsCount > 0
            ? Math.round((newToolMatchCount / totalToolsCount) * 100)
            : matchResult.categoryScores.tools;
        const toolDelta = newToolScore - matchResult.categoryScores.tools;
        const projectedScore = Math.min(100, currentScore + Math.round(toolDelta * 0.20));

        simulations.push({
            action: `Master ${toolGap.tech}`,
            currentScore,
            projectedScore,
            impact: projectedScore - currentScore,
        });
    }

    // Simulate experience improvement
    if (matchResult.experienceMatch.verdict === 'below') {
        simulations.push({
            action: 'Gain 1 more year of relevant experience',
            currentScore,
            projectedScore: Math.min(100, currentScore + 8),
            impact: 8,
        });
    }

    // Simulate resume optimization
    if (matchResult.categoryScores.skills < 70) {
        simulations.push({
            action: 'Optimize resume with missing keywords',
            currentScore,
            projectedScore: Math.min(100, currentScore + 6),
            impact: 6,
        });
    }

    // Sort by impact descending
    return simulations.sort((a, b) => b.impact - a.impact);
};

// ── 6. Predict Interview Topics ──────────────────────────────────────────────

/**
 * Predicts likely interview topics and questions based on JD requirements.
 * @param {Object} requirements - Extracted JD requirements
 * @param {Object} matchResult - Match analysis
 * @returns {Promise<Object>} Interview prediction
 */
const predictInterviewTopics = async (requirements, matchResult) => {
    // Try LLM first for higher quality predictions
    const systemPrompt = `You are an expert technical interviewer. Based on a job description's requirements and a candidate's skill profile, predict interview questions.
Return ONLY valid JSON (no markdown, no explanation):
{
  "likelyTopics": ["topic1", "topic2"],
  "predictedQuestions": [
    { "question": "...", "category": "technical", "difficulty": "medium" },
    { "question": "...", "category": "behavioral", "difficulty": "easy" }
  ],
  "preparationTips": ["tip1", "tip2"]
}
Rules:
- category must be: technical, behavioral, situational, or system_design
- difficulty must be: easy, medium, or hard
- Generate 5-8 questions covering different categories
- Make tips specific and actionable
- Focus on the candidate's gaps and the role's key requirements`;

    const userPrompt = `Job requires these skills: ${requirements.skills?.join(', ')}
Tools: ${requirements.tools?.join(', ')}
Candidate matches: ${matchResult.matchedSkills?.join(', ')}
Candidate is missing: ${matchResult.missingSkills?.join(', ')}
Experience level: ${requirements.experience?.level || 'mid'}
Responsibilities: ${requirements.responsibilities?.slice(0, 5).join('; ')}`;

    try {
        const llmResponse = await callLLM(systemPrompt, userPrompt, 0.5);
        if (llmResponse) {
            const cleaned = llmResponse.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                likelyTopics: Array.isArray(parsed.likelyTopics) ? parsed.likelyTopics : [],
                predictedQuestions: Array.isArray(parsed.predictedQuestions)
                    ? parsed.predictedQuestions.map(q => ({
                        question: q.question || '',
                        category: ['technical', 'behavioral', 'situational', 'system_design'].includes(q.category) ? q.category : 'technical',
                        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
                    }))
                    : [],
                preparationTips: Array.isArray(parsed.preparationTips) ? parsed.preparationTips : [],
            };
        }
    } catch (err) {
        logger.warn('LLM interview prediction failed, using fallback:', err.message);
    }

    // Fallback: rule-based prediction
    return predictInterviewTopicsFallback(requirements, matchResult);
};

/**
 * Fallback interview topic prediction
 */
const predictInterviewTopicsFallback = (requirements, matchResult) => {
    const topics = [];
    const questions = [];
    const tips = [];

    // Add topics from required skills
    const topSkills = (requirements.skills || []).slice(0, 5);
    topics.push(...topSkills);

    // Generate technical questions for matched skills
    for (const skill of matchResult.matchedSkills?.slice(0, 3) || []) {
        questions.push({
            question: `Explain your experience with ${skill} and a challenging problem you solved using it.`,
            category: 'technical',
            difficulty: 'medium',
        });
    }

    // Generate gap-focused questions
    for (const skill of matchResult.missingSkills?.slice(0, 2) || []) {
        questions.push({
            question: `How would you approach learning ${skill} if required for this role?`,
            category: 'behavioral',
            difficulty: 'easy',
        });
    }

    // System design question based on experience level
    if (requirements.experience?.level === 'senior' || requirements.experience?.level === 'lead') {
        questions.push({
            question: 'Design a scalable system for one of the key responsibilities mentioned in this role.',
            category: 'system_design',
            difficulty: 'hard',
        });
        topics.push('System Design');
    }

    // Add situational questions
    questions.push({
        question: 'Describe a time when you had to work with a technology you were unfamiliar with. How did you ramp up?',
        category: 'situational',
        difficulty: 'medium',
    });
    questions.push({
        question: 'Tell me about a project where you had to balance quality with tight deadlines.',
        category: 'behavioral',
        difficulty: 'medium',
    });

    // Preparation tips
    if (matchResult.missingSkills?.length > 0) {
        tips.push(`Study fundamentals of missing skills: ${matchResult.missingSkills.slice(0, 3).join(', ')}`);
    }
    tips.push('Prepare 3-4 STAR-format stories about your past projects and challenges');
    tips.push('Review the company\'s tech blog and recent products to show genuine interest');
    if (matchResult.matchedSkills?.length > 0) {
        tips.push(`Prepare deep-dive examples using: ${matchResult.matchedSkills.slice(0, 3).join(', ')}`);
    }

    return {
        likelyTopics: [...new Set(topics)].slice(0, 8),
        predictedQuestions: questions.slice(0, 8),
        preparationTips: tips,
    };
};

// ── 7. Gather User Context (re-uses pattern from coachService) ───────────────

/**
 * Gathers user context needed for match computation.
 * Optimized query: selects only fields needed for matching.
 * @param {string} userId
 * @param {string|null} resumeId - Specific resume to use, or null for latest
 * @returns {Promise<Object>} User context for matching
 */
const gatherMatchContext = async (userId, resumeId = null) => {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    // Fetch resume: specific one or latest analyzed
    let resume;
    if (resumeId) {
        resume = await Resume.findOne({ _id: resumeId, user: userId }).lean();
    } else {
        resume = await Resume.findOne({ user: userId, status: 'analyzed' })
            .sort({ createdAt: -1 }).lean();
    }
    // If no analyzed resume, try any resume
    if (!resume) {
        resume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
    }

    // Fetch active roadmap
    const roadmap = await LearningRoadmap.findOne({ user: userId, status: 'active' }).lean();

    // Fetch completed interviews
    const interviews = await Interview.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 }).limit(10).lean();

    let avgScore = 0;
    let strengths = [];
    let weaknesses = [];
    if (interviews.length > 0) {
        const total = interviews.reduce((acc, i) => acc + (i.summary?.overallScore || i.overallScore || 0), 0);
        avgScore = Math.round(total / interviews.length);
        interviews.forEach(i => {
            if (i.summary?.strongAreas) strengths.push(...i.summary.strongAreas);
            if (i.summary?.weakAreas) weaknesses.push(...i.summary.weakAreas);
        });
        strengths = [...new Set(strengths)].slice(0, 5);
        weaknesses = [...new Set(weaknesses)].slice(0, 5);
    }

    return {
        user: {
            name: user.name,
            currentRole: user.currentRole || null,
            targetRole: user.targetRole || null,
            experienceYears: user.experienceYears || 0,
            profileCompleteness: user.profileCompleteness || 30,
            careerReadiness: user.careerReadiness || 0,
            missingSkills: user.missingSkills || [],
        },
        resume: resume ? {
            _id: resume._id,
            originalName: resume.originalName,
            atsScore: resume.atsScore || 0,
            skills: resume.skills || [],
            missingKeywords: resume.missingKeywords || [],
            hasResume: true,
        } : { hasResume: false, atsScore: 0, skills: [], missingKeywords: [] },
        roadmap: roadmap ? {
            title: roadmap.title,
            completionPercentage: roadmap.completionPercentage || 0,
            milestones: (roadmap.milestones || []).map(m => ({
                title: m.title,
                status: m.status,
                skills: m.skills || [],
                priority: m.priority,
            })),
            hasRoadmap: true,
        } : { hasRoadmap: false, completionPercentage: 0, milestones: [] },
        interviews: {
            count: interviews.length,
            averageScore: avgScore,
            strengths,
            weaknesses,
            hasInterviews: interviews.length > 0,
        },
    };
};

// ── Orchestrator: Full Analysis Pipeline ─────────────────────────────────────

/**
 * Runs the complete job match analysis pipeline.
 * @param {string} userId
 * @param {string} jobDescriptionText
 * @param {Object} options - { resumeId, jobTitle, company }
 * @returns {Promise<Object>} Complete analysis result (saved to DB)
 */
const runFullAnalysis = async (userId, jobDescriptionText, options = {}) => {
    const { resumeId, jobTitle, company } = options;

    // 1. Create the JobMatch document in "analyzing" state
    const jobMatch = await JobMatch.create({
        user: userId,
        resume: resumeId || null,
        jobTitle: jobTitle || 'Untitled Position',
        company: company || null,
        jobDescriptionText,
        status: 'analyzing',
    });

    try {
        // 2. Gather user context
        const userContext = await gatherMatchContext(userId, resumeId);
        // Link to actual resume used
        if (userContext.resume._id && !jobMatch.resume) {
            jobMatch.resume = userContext.resume._id;
        }

        // 3. Extract requirements from JD
        const extractedRequirements = await extractJobRequirements(jobDescriptionText);
        jobMatch.extractedRequirements = extractedRequirements;

        // 4. Compute match score
        const matchResult = computeMatchScore(userContext, extractedRequirements);
        jobMatch.matchResult = matchResult;

        // 5. Generate gap analysis
        const gapAnalysis = generateGapAnalysis(matchResult, userContext, extractedRequirements);
        jobMatch.gapAnalysis = gapAnalysis;

        // 6. Compute hiring probability
        const hiringProb = computeHiringProbability(matchResult, gapAnalysis, userContext);
        jobMatch.hiringProbability = hiringProb;

        // 7. Simulate improvements
        const simulations = simulateImprovements(matchResult, gapAnalysis);
        jobMatch.improvementSimulations = simulations;

        // 8. Predict interview topics
        const predictions = await predictInterviewTopics(extractedRequirements, matchResult);
        jobMatch.interviewPrediction = predictions;

        // 9. Mark as completed and save
        jobMatch.status = 'completed';
        await jobMatch.save();

        logger.info(`Job match analysis completed for user ${userId}, score: ${matchResult.overallScore}`);
        return jobMatch;

    } catch (error) {
        // Persist error state
        jobMatch.status = 'error';
        jobMatch.errorMessage = error.message;
        await jobMatch.save();
        logger.error(`Job match analysis failed for user ${userId}:`, error.message);
        throw error;
    }
};

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    extractJobRequirements,
    computeMatchScore,
    generateGapAnalysis,
    computeHiringProbability,
    simulateImprovements,
    predictInterviewTopics,
    gatherMatchContext,
    runFullAnalysis,
};
