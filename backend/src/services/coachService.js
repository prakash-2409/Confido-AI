/**
 * Career Coach Service
 * 
 * Aggregates user profile, resume analysis, roadmap progress, and interview results.
 * Invokes LLM with specific context, and fallback to rule-based engine when LLM is unavailable.
 */

const config = require('../config/env');
const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const LearningRoadmap = require('../models/LearningRoadmap');
const CoachChat = require('../models/CoachChat');
const JobMatch = require('../models/JobMatch');
const { callLLM } = require('../utils/llmClient');
const { updateCareerReadiness } = require('./readinessEngine');
const logger = require('../config/logger');

/**
 * Gathers complete context for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Aggregated context
 */
const gatherUserContext = async (userId) => {
    // 1. Fetch user profile
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 2. Fetch latest analyzed resume
    const latestResume = await Resume.findOne({ user: userId, status: 'analyzed' })
        .sort({ createdAt: -1 });

    // 3. Fetch active learning roadmap
    const activeRoadmap = await LearningRoadmap.findOne({ user: userId, status: 'active' });

    // 4. Fetch completed interviews
    const completedInterviews = await Interview.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 });

    // Calculate average interview score
    let avgInterviewScore = 0;
    let interviewStrengths = [];
    let interviewWeaknesses = [];
    if (completedInterviews.length > 0) {
        const total = completedInterviews.reduce(
            (acc, i) => acc + (i.summary?.overallScore || i.overallScore || 0), 
            0
        );
        avgInterviewScore = Math.round(total / completedInterviews.length);
        
        // Collate strengths/weaknesses
        completedInterviews.forEach(i => {
            if (i.summary?.strongAreas) interviewStrengths.push(...i.summary.strongAreas);
            if (i.summary?.weakAreas) interviewWeaknesses.push(...i.summary.weakAreas);
        });
        
        // Remove duplicates
        interviewStrengths = Array.from(new Set(interviewStrengths)).slice(0, 5);
        interviewWeaknesses = Array.from(new Set(interviewWeaknesses)).slice(0, 5);
    }

    return {
        user: {
            name: user.name,
            currentRole: user.currentRole || 'Not specified',
            targetRole: user.targetRole || 'Not specified',
            experienceYears: user.experienceYears || 0,
            profileCompleteness: user.profileCompleteness || 30,
            careerReadiness: user.careerReadiness || 0,
            missingSkills: user.missingSkills || []
        },
        resume: latestResume ? {
            originalName: latestResume.originalName,
            atsScore: latestResume.atsScore || 0,
            skills: latestResume.skills || [],
            missingKeywords: latestResume.missingKeywords || [],
            summary: latestResume.summary || '',
            hasResume: true
        } : { hasResume: false, atsScore: 0, skills: [], missingKeywords: [] },
        roadmap: activeRoadmap ? {
            title: activeRoadmap.title,
            completionPercentage: activeRoadmap.completionPercentage || 0,
            milestones: activeRoadmap.milestones.map(m => ({
                title: m.title,
                status: m.status,
                skills: m.skills,
                priority: m.priority
            })),
            hasRoadmap: true
        } : { hasRoadmap: false, completionPercentage: 0, milestones: [] },
        interviews: {
            count: completedInterviews.length,
            averageScore: avgInterviewScore,
            strengths: interviewStrengths,
            weaknesses: interviewWeaknesses,
            hasInterviews: completedInterviews.length > 0
        },
        // Phase 3: Latest Job Match Intelligence data
        jobMatch: await (async () => {
            const latestMatch = await JobMatch.findOne({ user: userId, status: 'completed' })
                .sort({ createdAt: -1 })
                .select('jobTitle company matchResult.overallScore matchResult.matchedSkills matchResult.missingSkills hiringProbability.level hiringProbability.topBlockers improvementSimulations')
                .lean();
            if (!latestMatch) return { hasJobMatch: false };
            return {
                hasJobMatch: true,
                jobTitle: latestMatch.jobTitle,
                company: latestMatch.company,
                overallScore: latestMatch.matchResult?.overallScore || 0,
                matchedSkills: latestMatch.matchResult?.matchedSkills || [],
                missingSkills: latestMatch.matchResult?.missingSkills || [],
                hiringLevel: latestMatch.hiringProbability?.level || 'unknown',
                topBlockers: latestMatch.hiringProbability?.topBlockers || [],
                topImprovements: (latestMatch.improvementSimulations || []).slice(0, 3).map(s => s.action),
            };
        })()
    };
};

/**
 * Builds the LLM System Prompt with the gathered user context
 * @param {Object} context - Aggregated user context
 * @returns {string} System prompt
 */
const buildSystemPrompt = (context) => {
    const missingSkillsStr = context.user.missingSkills.map(s => s.skillName).join(', ');
    const missingKeywordsStr = context.resume.missingKeywords.join(', ');
    const resumeSkillsStr = context.resume.skills.join(', ');
    
    const roadmapMilestonesStr = context.roadmap.milestones
        .map(m => `- [${m.status === 'completed' ? 'x' : ' '}] ${m.title} (${m.priority} priority)`)
        .join('\n');

    return `You are an expert AI Career Coach and Mentor named "CareerAI Coach". 
Your goal is to guide the user towards landing their dream role. You are supportive, analytical, and highly structured in your advice.

Here is the candidate's dynamic profile data from the database. Use this context to personalize ALL answers:

[USER PROFILE]
- Name: ${context.user.name}
- Current Role: ${context.user.currentRole}
- Target Role: ${context.user.targetRole}
- Experience: ${context.user.experienceYears} years
- Profile Completeness: ${context.user.profileCompleteness}%
- Career Readiness Score: ${context.user.careerReadiness}%

[ATS RESUME ANALYSIS]
- Resume Uploaded: ${context.resume.hasResume ? 'Yes' : 'No'}
${context.resume.hasResume ? `- File Name: ${context.resume.originalName}` : ''}
- ATS Score: ${context.resume.atsScore}%
- Extracted Skills: ${resumeSkillsStr || 'None extracted yet'}
- Missing Keywords (Gaps vs Target Role): ${missingKeywordsStr || 'None identified'}

[ROADMAP PROGRESS]
- Learning Roadmap: ${context.roadmap.hasRoadmap ? context.roadmap.title : 'None active'}
- Roadmap Completion: ${context.roadmap.completionPercentage}%
${context.roadmap.hasRoadmap ? `Milestones:\n${roadmapMilestonesStr}` : ''}

[INTERVIEW PREPARATION]
- Completed Interviews: ${context.interviews.count}
- Avg Score: ${context.interviews.averageScore}%
- Identified Strengths: ${context.interviews.strengths.join(', ') || 'None yet'}
- Identified Weaknesses/Gaps: ${context.interviews.weaknesses.join(', ') || 'None yet'}

Always refer to their specific stats. If they ask about skills, refer to their missing keywords or missing skills in the context. If they ask about readiness, tie it back to their Career Readiness Score.
Keep answers concise, professional, and actionable. Use markdown list items and bullet points for readability.
${context.jobMatch?.hasJobMatch ? `
[JOB MATCH INTELLIGENCE]
- Latest Job Analyzed: ${context.jobMatch.jobTitle}${context.jobMatch.company ? ` at ${context.jobMatch.company}` : ''}
- Match Score: ${context.jobMatch.overallScore}%
- Hiring Probability: ${context.jobMatch.hiringLevel}
- Matched Skills: ${context.jobMatch.matchedSkills.join(', ') || 'None'}
- Missing Skills for Job: ${context.jobMatch.missingSkills.join(', ') || 'None'}
- Top Blockers: ${context.jobMatch.topBlockers.join('; ') || 'None'}
- Top Improvement Actions: ${context.jobMatch.topImprovements.join('; ') || 'None'}` : ''}`;
};

/**
 * Local Fallback Engine when LLM is unavailable
 * @param {string} action - Action type
 * @param {Object} context - User context
 * @param {string} userQuery - Raw user query
 * @returns {Object} { text: String, data: Mixed|null }
 */
const getLocalFallbackResponse = (action, context, userQuery) => {
    logger.info(`Invoking Local Fallback Engine for action: ${action || 'general_query'}`);

    if (action === 'resume_improvement') {
        if (!context.resume.hasResume) {
            return {
                text: "I analyzed your profile, but it looks like you haven't uploaded a resume yet. Please upload your resume in the Resume section so I can provide specific bullet-point feedback!",
                data: null
            };
        }

        const missing = context.resume.missingKeywords.slice(0, 4);
        if (missing.length === 0) missing.push('Key Metrics', 'System Design', 'Project Leadership');

        const weakBullets = [
            {
                original: "Responsible for writing backend APIs and maintaining databases.",
                rewritten: `Developed ${context.user.targetRole.includes('Frontend') ? 'React APIs and state modules' : 'RESTful APIs in Node.js/Express'}, reducing database query latency by 35% through indexing and redis caching.`,
                impact: "Quantified database latency reduction by 35%."
            },
            {
                original: "Assisted the team in frontend feature development.",
                rewritten: "Designed and implemented 10+ reusable UI components, speeding up product design lifecycle iterations by 25%.",
                impact: "Quantified design efficiency improvement by 25%."
            }
        ];

        return {
            text: `Here is my analysis of your resume bullet points. To make your resume stand out to employers and ATS filters, you should rewrite passive descriptions into quantified, achievement-oriented bullets. I have highlighted suggestions and key keywords to incorporate.`,
            data: {
                analysis: "Your resume details your responsibilities but lacks quantified metrics. Adding specific indicators of scale, latency reduction, or team speedups will significantly improve your ATS scores.",
                weakBullets: weakBullets,
                missingKeywords: missing,
                actionItems: [
                    "Incorporate metrics in every project bullet point.",
                    `Naturally add missing keywords like: ${missing.join(', ')}.`,
                    "Lead every bullet point with strong action verbs (Optimized, Spearheaded, Engineered)."
                ]
            }
        };
    }

    if (action === 'project_recommendations') {
        const skills = context.resume.missingKeywords.length > 0 
            ? context.resume.missingKeywords.slice(0, 3) 
            : ['React', 'Node.js', 'PostgreSQL'];

        const recs = [
            {
                title: `Full-Stack ${context.user.targetRole} Portal`,
                level: 'Intermediate',
                description: `Build a secure dashboard platform utilizing ${skills[0] || 'React'} and ${skills[1] || 'Node.js'}. Include features like user authentication, paginated data loading, and query analytics.`,
                skillsLearned: [skills[0] || 'React', skills[1] || 'Node.js', 'JWT Auth']
            },
            {
                title: `Distributed ${skills[2] || 'System'} Manager`,
                level: 'Advanced',
                description: `Create a microservices application containerized with Docker, communicating via a Message Queue. Integrate ${skills[2] || 'PostgreSQL'} for transactional storage and Redis for caching.`,
                skillsLearned: ['Docker', 'Microservices', skills[2] || 'PostgreSQL', 'Redis']
            },
            {
                title: `Responsive Portfolio Showcase`,
                level: 'Beginner',
                description: `Build a highly polished, interactive developer portfolio demonstrating grid layouts, smooth CSS animations, and direct contact email integrations.`,
                skillsLearned: ['HTML5', 'Tailwind CSS', 'Vanilla JS']
            }
        ];

        return {
            text: `Based on the skills missing from your resume and profile relative to a ${context.user.targetRole} role, I recommend building the following portfolio projects. They are categorized by complexity to help you transition from beginner to advanced topics.`,
            data: {
                recommendations: recs
            }
        };
    }

    if (action === 'readiness_check') {
        const ats = context.resume.atsScore;
        const interview = context.interviews.averageScore;
        const roadmap = context.roadmap.completionPercentage;
        const profile = context.user.profileCompleteness;

        // Weakest area logic
        const scores = [
            { name: 'ATS Resume Score', score: ats, link: '/dashboard/resume', fix: 'Upload a newer resume or rewrite bullet points.' },
            { name: 'Mock Interview Performance', score: interview, link: '/dashboard/interview', fix: 'Complete a classic or 4-round mock interview prep session.' },
            { name: 'Learning Roadmap Milestone Progress', score: roadmap, link: '/dashboard/roadmap', fix: 'Mark at least two milestones as completed on your roadmap.' },
            { name: 'Profile Completeness', score: profile, link: '/dashboard/profile', fix: 'Add your current/target roles, years of experience, and verify your email.' }
        ];

        // Sort ascending to get lowest score
        scores.sort((a, b) => a.score - b.score);
        const weakest = scores[0];

        const plan = scores.map((s, index) => ({
            step: `Improve your ${s.name} (currently ${s.score}%). Action: ${s.fix}`,
            timeframe: `Step ${index + 1} (Priority: ${index === 0 ? 'High' : 'Medium'})`
        }));

        return {
            text: `I have compiled your Internship Readiness Report. Your current unified Career Readiness Score is **${context.user.careerReadiness}%**. To be fully competitive for roles, we should aim to raise this above **80%**. Here is a detailed breakdown of your weakest areas and a step-by-step optimization plan.`,
            data: {
                overallReadiness: context.user.careerReadiness,
                weakestArea: weakest.name,
                readinessReport: `Your weakest component is currently ${weakest.name} at ${weakest.score}%. Strengthening this area is the fastest way to raise your employability prospects.`,
                improvementPlan: plan
            }
        };
    }

    // Standard career questions handling
    const queryLower = (userQuery || '').toLowerCase();
    
    if (queryLower.includes('why is my ats score low') || queryLower.includes('ats score')) {
        if (!context.resume.hasResume) {
            return {
                text: `You haven't uploaded a resume yet! Go to the [Resume Analysis section](/dashboard/resume) to upload your resume. Once analyzed, I can tell you exactly why your score is low and what key terms are missing.`,
                data: null
            };
        }
        return {
            text: `Your current ATS Score is **${context.resume.atsScore}%**. 
            
Here is why your score needs improvement:
1. **Missing Keywords**: Your resume lacks critical keywords for the **${context.user.targetRole}** role. You are missing: *${context.resume.missingKeywords.slice(0, 5).join(', ') || 'none identified yet'}*.
2. **Quantified Achievements**: Your experience descriptions focus mostly on duties rather than results. Adding specific numbers (e.g., "sped up loads by 30%") will significantly improve parsing relevance.
3. **Format Standards**: Ensure you are using simple, single-column layouts in PDF/Docx format without complex columns or tables.

I recommend clicking the **"Suggest Resume Improvements"** quick action below to see tailored bullet rewrites!`,
            data: null
        };
    }

    if (queryLower.includes('what should i learn next') || queryLower.includes('learn next') || queryLower.includes('what to learn')) {
        const nextSkill = context.resume.missingKeywords[0] || (context.user.missingSkills[0]?.skillName) || 'System Design';
        return {
            text: `Looking at your target role of **${context.user.targetRole}** and missing resume keywords, your top priority should be learning: **${nextSkill}**.
            
Here is what you should do next:
1. **Roadmap**: Check your [Personal Learning Roadmap](/dashboard/roadmap) for resource links and structured guides on **${nextSkill}**.
2. **Projects**: Build a mini-project focusing specifically on this technology to build hands-on competency.
3. **Keywords**: Once you understand the concepts, update your resume to include this keyword.

If you haven't activated a learning roadmap, please visit the [Growth Roadmap section](/dashboard/roadmap) to initialize one!`,
            data: null
        };
    }

    if (queryLower.includes('ready for internships') || queryLower.includes('am i ready')) {
        const verdict = context.user.careerReadiness >= 80 
            ? "Yes! You are in the **High Readiness** tier. You have a solid ATS resume score and mock interview average. You should start applying to internships immediately."
            : `Not quite yet. Your Career Readiness is currently at **${context.user.careerReadiness}%**. We should target at least **80%** before applying.`;
            
        return {
            text: `${verdict}
            
Here are your current numbers:
- **ATS Resume Score**: ${context.resume.atsScore}%
- **Mock Interview Avg**: ${context.interviews.averageScore}%
- **Roadmap Milestones**: ${context.roadmap.completionPercentage}% complete

You can click **"Run Internship Readiness Check"** below to generate a detailed improvement plan!`,
            data: null
        };
    }

    if (queryLower.includes('what projects') || queryLower.includes('project recommendations') || queryLower.includes('portfolio')) {
        const skill = context.resume.missingKeywords[0] || 'Fullstack Development';
        return {
            text: `To boost your profile, you should build a portfolio project that highlights: **${skill}**.
            
I suggest building:
- **Beginner**: A simple client app testing the fundamentals.
- **Intermediate**: A full-stack application with user authentication.
- **Advanced**: A microservices or server-rendered app deployed using Docker.

Click the **"Recommend Portfolio Projects"** action button to see structured project specs!`,
            data: null
        };
    }

    if (queryLower.includes('companies should i target') || queryLower.includes('companies')) {
        return {
            text: `For a **${context.user.targetRole}** with your experience level (${context.user.experienceYears} years), you should target:
            
1. **Tech Startups**: Look for Series A/B startups. They hire aggressively, value quick adapters, and offer high ownership.
2. **Mid-Market Product Firms**: Companies like HubSpot, Wayfair, or Canva are great for structured mentorship and intermediate growth.
3. **Enterprise Tech**: Companies like Stripe, Amazon, or Salesforce hire via standard university/early-career tracks.

Make sure your mock interview scores are above **75%** before applying to mid-market or enterprise companies to pass their technical screens!`,
            data: null
        };
    }

    if (queryLower.includes('highest impact') || queryLower.includes('impact skill') || queryLower.includes('what skill gives')) {
        const topSkill = context.resume.missingKeywords[0] || 'System Design & Scalability';
        return {
            text: `The skill that will give you the **highest impact** right now is: **${topSkill}**.
            
Why?
- It is a highly sought-after keyword in job descriptions for **${context.user.targetRole}**.
- Adding this single keyword can boost your resume's ATS match score immediately.
- Interviewers frequently ask core technical questions surrounding this concept.

Make sure you learn its core principles and display it clearly under your skills section.`,
            data: null
        };
    }

    // Default conversational reply
    return {
        text: `Hi ${context.user.name}! I am your AI Career Coach. 

I have analyzed your details:
- Target Role: **${context.user.targetRole}**
- ATS Score: **${context.resume.atsScore}%**
- Interview Average: **${context.interviews.averageScore}%**
- Career Readiness: **${context.user.careerReadiness}%**

How can I help you today? You can type a question, or use one of the quick tools below to check your resume, recommend projects, or run a readiness review.`,
        data: null
    };
};

/**
 * Process user message or action trigger
 * @param {string} userId - User ID
 * @param {string} message - User input text
 * @param {string} [action] - Special action keyword ('resume_improvement'|'project_recommendations'|'readiness_check')
 * @returns {Promise<Object>} Formatted message object to save/return
 */
const processMessage = async (userId, message, action) => {
    // 1. Gather context
    const context = await gatherUserContext(userId);

    // 2. Prepare templates for LLM if action is specified
    let systemPrompt = buildSystemPrompt(context);
    let userPrompt = message || '';
    let responseType = 'text';

    if (action === 'resume_improvement') {
        responseType = 'resume_improvement';
        systemPrompt += `\n\nCRITICAL: The user has requested structured suggestions to improve their resume. 
You must respond in valid JSON format. Do not write any text outside of the JSON block.
Format your output exactly as follows:
{
    "analysis": "Brief analysis of the resume structure and metrics...",
    "weakBullets": [
        { "original": "Original weak bullet point", "rewritten": "Quantified rewritten bullet point", "impact": "Explanation of metric/impact added" }
    ],
    "missingKeywords": ["keyword1", "keyword2"],
    "actionItems": ["Action item 1", "Action item 2"]
}`;
        userPrompt = "Analyze my resume bullet points and suggest rewrites with quantified metrics, missing keywords, and action items.";
    } else if (action === 'project_recommendations') {
        responseType = 'project_recommendations';
        systemPrompt += `\n\nCRITICAL: The user has requested portfolio project recommendations.
You must respond in valid JSON format. Do not write any text outside of the JSON block.
Format your output exactly as follows:
{
    "recommendations": [
        { "title": "Project Title", "level": "Beginner|Intermediate|Advanced", "description": "Short project description", "skillsLearned": ["skill1", "skill2"] }
    ]
}`;
        userPrompt = "Recommend 3 projects at different levels mapped to my missing skills and target role.";
    } else if (action === 'readiness_check') {
        responseType = 'readiness_check';
        systemPrompt += `\n\nCRITICAL: The user has requested an Internship Readiness Report.
You must respond in valid JSON format. Do not write any text outside of the JSON block.
Format your output exactly as follows:
{
    "overallReadiness": ${context.user.careerReadiness},
    "weakestArea": "Name of weakest area",
    "readinessReport": "Detailed assessment of their readiness...",
    "improvementPlan": [
        { "step": "Action step description", "timeframe": "Timeframe (e.g. 1 week)" }
    ]
}`;
        userPrompt = "Generate my Internship Readiness Report and detailed improvement plan based on my current scores.";
    }

    // 3. Update Unified Career Readiness Score in user DB
    await updateCareerReadiness(userId);

    // 4. Try LLM Call
    let assistantText = null;
    let assistantData = null;

    if (config.llm.openaiApiKey || config.llm.geminiApiKey) {
        try {
            logger.info('Calling LLM for coach response...');
            const rawResponse = await callLLM(systemPrompt, userPrompt, 0.7);
            
            if (rawResponse) {
                if (action) {
                    // Try parsing JSON response
                    try {
                        const jsonStart = rawResponse.indexOf('{');
                        const jsonEnd = rawResponse.lastIndexOf('}') + 1;
                        if (jsonStart !== -1 && jsonEnd !== -1) {
                            const jsonStr = rawResponse.substring(jsonStart, jsonEnd);
                            assistantData = JSON.parse(jsonStr);
                            
                            // Formulate introduction text depending on the action
                            if (action === 'resume_improvement') {
                                assistantText = "Here are my analysis and specific bullet point rewrites to optimize your resume:";
                            } else if (action === 'project_recommendations') {
                                assistantText = "I have compiled a list of recommended projects mapped to your skill gaps:";
                            } else if (action === 'readiness_check') {
                                assistantText = `Here is your Internship Readiness Report. Your current readiness score is ${context.user.careerReadiness}%:`;
                            }
                        } else {
                            throw new Error('No JSON found in LLM response');
                        }
                    } catch (jsonErr) {
                        logger.error('JSON parsing of LLM response failed, falling back to text:', jsonErr);
                        assistantText = rawResponse;
                    }
                } else {
                    assistantText = rawResponse;
                }
            }
        } catch (llmErr) {
            logger.error('LLM call threw an error, falling back to local engine:', llmErr);
        }
    }

    // 5. Fallback to Local Engine if LLM failed or wasn't configured
    if (!assistantText) {
        const fallback = getLocalFallbackResponse(action, context, message);
        assistantText = fallback.text;
        assistantData = fallback.data;
    }

    // 6. Save message pair to database
    let chat = await CoachChat.findOne({ user: userId });
    if (!chat) {
        chat = new CoachChat({ user: userId, messages: [] });
    }

    const userMsg = {
        sender: 'user',
        text: message || (action ? `[Action Triggered: ${action}]` : ''),
        timestamp: new Date()
    };

    const assistantMsg = {
        sender: 'assistant',
        text: assistantText,
        type: responseType,
        data: assistantData,
        timestamp: new Date()
    };

    chat.messages.push(userMsg);
    chat.messages.push(assistantMsg);

    // Keep history reasonable (last 50 messages)
    if (chat.messages.length > 50) {
        chat.messages = chat.messages.slice(-50);
    }

    await chat.save();

    return {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        history: chat.messages
    };
};

module.exports = {
    gatherUserContext,
    processMessage
};
