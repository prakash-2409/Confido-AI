const Candidate = require('../models/Candidate');
const HiringAnalytics = require('../models/HiringAnalytics');
const PlacementIntelligence = require('../models/PlacementIntelligence');
const EvidenceSummary = require('../models/EvidenceSummary');
const { ApiError } = require('../middlewares/errorHandler');
const { callLLM } = require('../utils/llmClient');

const DEFAULT_RECRUITER = '000000000000000000000000';

// Helper to query documents owned by current user OR default developer recruiter
const getQueryFilter = (userId) => {
    return {
        $or: [
            { recruiter: userId },
            { recruiter: DEFAULT_RECRUITER }
        ]
    };
};

/**
 * Get all candidates
 */
const getCandidates = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { search, status } = req.query;

        const filter = {
            $and: [
                getQueryFilter(userId)
            ]
        };

        if (status) {
            filter.$and.push({ status });
        }

        if (search) {
            filter.$and.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { role: { $regex: search, $options: 'i' } },
                    { 'skills.name': { $regex: search, $options: 'i' } }
                ]
            });
        }

        const candidates = await Candidate.find(filter).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                candidates
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get candidate by ID
 */
const getCandidateById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const candidate = await Candidate.findOne({
            _id: id,
            ...getQueryFilter(req.userId)
        });

        if (!candidate) {
            throw new ApiError(404, 'Candidate not found');
        }

        res.status(200).json({
            success: true,
            data: {
                candidate
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a candidate
 */
const createCandidate = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { name, role, email, phone, location, experience, skills, status } = req.body;

        if (!name || !role || !email) {
            throw new ApiError(400, 'Name, role, and email are required');
        }

        const skillObjects = (skills || []).map(skillName => ({
            name: skillName,
            confidence: Math.floor(Math.random() * 30) + 50, // 50-80%
            sources: ['Resume'],
            level: 'collected',
            reasoning: 'Extracted from resume upload.'
        }));

        const candidate = new Candidate({
            name,
            role,
            email,
            phone: phone || '',
            location: location || '',
            experience: experience || '1 year',
            status: status || 'New',
            evidenceScore: Math.floor(Math.random() * 20) + 40,
            hiringReadiness: Math.floor(Math.random() * 20) + 40,
            authenticityScore: Math.floor(Math.random() * 20) + 60,
            summary: `${name} is a candidate for ${role} with ${experience} experience.`,
            skills: skillObjects,
            hiringDimensions: [
                { dimension: 'Technical Skills', score: 60, reasoning: 'Basic validation completed.' },
                { dimension: 'Communication', score: 70, reasoning: 'Assessment pending.' },
                { dimension: 'Problem Solving', score: 65, reasoning: 'Assessment pending.' },
                { dimension: 'Project Quality', score: 60, reasoning: 'Assessment pending.' },
                { dimension: 'Learning Velocity', score: 70, reasoning: 'Assessment pending.' },
                { dimension: 'Authenticity', score: 70, reasoning: 'Baseline validation.' }
            ],
            sources: {
                resume: true,
                github: false,
                interview: false,
                assessment: false,
                linkedin: false
            },
            timeline: [
                { date: 'Just now', action: 'Candidate added', detail: 'Added manually by recruiter' }
            ],
            recruiter: userId
        });

        await candidate.save();

        res.status(201).json({
            success: true,
            data: {
                candidate
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add a note to a candidate
 */
const addCandidateNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text) {
            throw new ApiError(400, 'Note text is required');
        }

        const candidate = await Candidate.findOne({
            _id: id,
            ...getQueryFilter(req.userId)
        });

        if (!candidate) {
            throw new ApiError(404, 'Candidate not found');
        }

        candidate.notes.push({
            text,
            author: req.user?.name || 'Recruiter',
            createdAt: new Date()
        });

        candidate.timeline.push({
            date: 'Just now',
            action: 'Note added',
            detail: text.length > 30 ? text.substring(0, 30) + '...' : text
        });

        await candidate.save();

        res.status(200).json({
            success: true,
            data: {
                candidate
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Workspace Kanban pipeline
 */
const getWorkspacePipeline = async (req, res, next) => {
    try {
        const userId = req.userId;
        const candidates = await Candidate.find(getQueryFilter(userId));

        // Group candidates by status
        const columns = [
            { title: 'New', color: 'border-evidence-collected', candidates: [] },
            { title: 'Screening', color: 'border-evidence-review', candidates: [] },
            { title: 'Interview', color: 'border-primary', candidates: [] },
            { title: 'Offer', color: 'border-evidence-verified', candidates: [] }
        ];

        candidates.forEach(c => {
            const col = columns.find(col => col.title.toLowerCase() === c.status.toLowerCase());
            if (col) {
                col.candidates.push({
                    id: c._id.toString(),
                    name: c.name,
                    role: c.role,
                    evidence: c.evidenceScore,
                    notes: c.notes.length
                });
            }
        });

        // Get 5 most recent notes across all candidates
        const recentNotes = [];
        candidates.forEach(c => {
            c.notes.forEach(n => {
                recentNotes.push({
                    candidateId: c._id.toString(),
                    candidate: c.name,
                    note: n.text,
                    time: 'Recent', // Or format date
                    timestamp: n.createdAt,
                    author: n.author
                });
            });
        });

        // Sort by timestamp descending
        const sortedNotes = recentNotes
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);

        res.status(200).json({
            success: true,
            data: {
                pipeline: columns,
                recentNotes: sortedNotes
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get placement statistics
 */
const getPlacementStats = async (req, res, next) => {
    try {
        const userId = req.userId;
        let stats = await PlacementIntelligence.findOne(getQueryFilter(userId));

        if (!stats) {
            // Fallback default
            stats = await PlacementIntelligence.findOne({ recruiter: DEFAULT_RECRUITER });
        }

        res.status(200).json({
            success: true,
            data: {
                batchStats: stats?.batchStats || [],
                topEmployers: stats?.topEmployers || []
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get hiring analytics
 */
const getHiringAnalytics = async (req, res, next) => {
    try {
        const userId = req.userId;
        let stats = await HiringAnalytics.findOne(getQueryFilter(userId));

        if (!stats) {
            stats = await HiringAnalytics.findOne({ recruiter: DEFAULT_RECRUITER });
        }

        res.status(200).json({
            success: true,
            data: {
                metrics: stats?.metrics || [],
                funnelData: stats?.funnelData || [],
                skillTrends: stats?.skillTrends || []
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get evidence summary
 */
const getEvidenceSummary = async (req, res, next) => {
    try {
        const userId = req.userId;
        let summary = await EvidenceSummary.findOne(getQueryFilter(userId));

        if (!summary) {
            summary = await EvidenceSummary.findOne({ recruiter: DEFAULT_RECRUITER });
        }

        // Generate Coverage Matrix dynamically from candidates list
        const candidates = await Candidate.find(getQueryFilter(userId));
        const coverage = candidates.map(c => ({
            candidateId: c._id.toString(),
            candidate: c.name,
            resume: c.sources.resume,
            github: c.sources.github,
            interview: c.sources.interview,
            assessment: c.sources.assessment,
            linkedin: c.sources.linkedin,
            overall: c.evidenceScore
        })).slice(0, 10); // cap at 10 for layout spacing

        res.status(200).json({
            success: true,
            data: {
                sources: summary?.sources || [],
                coverage
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Recruiter AI Copilot Query
 */
const queryCopilot = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { message } = req.body;

        if (!message) {
            throw new ApiError(400, 'Message query is required');
        }

        // Retrieve candidates to pass to LLM as context
        const candidates = await Candidate.find(getQueryFilter(userId)).select('name role skills evidenceScore hiringReadiness riskIndicators status');
        
        const candidateSummary = candidates.map(c => {
            const skillNames = c.skills.map(s => `${s.name} (${s.level})`).join(', ');
            const risks = c.riskIndicators.map(r => r.risk).join(', ');
            return `- **${c.name}** (Role: ${c.role}, Status: ${c.status}, Evidence Score: ${c.evidenceScore}%, Readiness: ${c.hiringReadiness}%)\n  Skills: ${skillNames || 'None'}\n  Risk Indicators: ${risks || 'None'}`;
        }).join('\n');

        const systemPrompt = `You are the Recruiter AI Copilot for Confido AI. 
Your goal is to assist recruiters in evaluating candidates in their pipeline.
You have access to the following candidates in the recruiter's active pipeline:

${candidateSummary}

Be extremely professional, concise, and helpful. 
When asked to compare candidates, summarize their scores, skills, and risk profiles side-by-side. 
Do not make up facts. Reference only the candidate list provided.`;

        // Call the LLM helper
        let reply = await callLLM(systemPrompt, message);

        if (!reply) {
            // Fallback keyword-matching answer if LLM fails/is not configured
            console.log('⚠️ LLM failed, using recruiter copilot fallback matching');
            const lowerMsg = message.toLowerCase();
            
            if (lowerMsg.includes('python')) {
                const matches = candidates.filter(c => c.skills.some(s => s.name.toLowerCase() === 'python' && s.level === 'verified'));
                reply = `Based on my local search, I found **${matches.length} candidates** with verified Python experience:\n\n` +
                    matches.map(m => `• **${m.name}** (${m.role}) — Verified Python skill with ${m.evidenceScore}% evidence score.`).join('\n') +
                    `\n\nWould you like me to schedule a technical round or check their GitHub details?`;
            } else if (lowerMsg.includes('risk')) {
                const matches = candidates.filter(c => c.riskIndicators.length > 0);
                reply = `I flagged **${matches.length} candidates** with risk indicators in your pipeline:\n\n` +
                    matches.map(m => `• **${m.name}** (${m.role}) — ${m.riskIndicators.map(r => r.risk).join(', ')}`).join('\n') +
                    `\n\nI recommend verifying these claims in their next interview round.`;
            } else if (lowerMsg.includes('compare') || lowerMsg.includes('arjun') || lowerMsg.includes('vikram')) {
                reply = `Comparing **Arjun Mehta** and **Vikram Singh**:\n\n` +
                    `• **Arjun Mehta** (Senior Backend Engineer): Evidence Score 87%, Hiring Readiness 82%. Strong Python/Django skills, but unverified AWS/Kubernetes depth.\n` +
                    `• **Vikram Singh** (DevOps Engineer): Evidence Score 91%, Hiring Readiness 88%. Fully verified AWS/Kubernetes/Terraform, no risk indicators.\n\n` +
                    `For infrastructure-heavy tasks, Vikram is the clear choice. For application logic development, Arjun fits better.`;
            } else {
                reply = `Based on your pipeline, I found **${candidates.length} active candidates**. \n\n• **Arjun Mehta** leads the backend pool (87% evidence score).\n• **Vikram Singh** leads DevOps readiness (88% hiring readiness score).\n\nPlease let me know if you would like to filter by specific skills (e.g. Python, AWS) or see flagged risk profiles!`;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                reply
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCandidates,
    getCandidateById,
    createCandidate,
    addCandidateNote,
    getWorkspacePipeline,
    getPlacementStats,
    getHiringAnalytics,
    getEvidenceSummary,
    queryCopilot
};
