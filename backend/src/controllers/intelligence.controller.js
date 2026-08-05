const Resume = require('../models/Resume');
const User = require('../models/User');
const PlacementReadiness = require('../models/PlacementReadiness');
const ResumeVersion = require('../models/ResumeVersion');
const HistoryTimeline = require('../models/HistoryTimeline');
const JobRole = require('../models/JobRole');
const { analyzeResumeAts } = require('../services/atsService');
const { matchSemantically } = require('../services/semanticMatcher');
const { compareVersions } = require('../services/diffEngine');
const { getBenchmarkStats } = require('../services/benchmarkService');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * POST /api/v1/ats/analyze
 * Run deep ATS analysis against a target job role
 */
const analyzeAts = async (req, res, next) => {
    try {
        const { resumeId, targetRole } = req.body;
        if (!resumeId || !targetRole) {
            throw new ApiError(400, 'Please provide resumeId and targetRole');
        }

        const resume = await Resume.findById(resumeId);
        if (!resume) throw new ApiError(404, 'Resume not found');

        let jobRole = await JobRole.findOne({ title: targetRole });
        if (!jobRole) jobRole = await JobRole.findOne({ title: 'Software Engineer' });

        const report = analyzeResumeAts(resume, resume.extractedText, jobRole.requiredSkills);

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/jd/parse
 * Parse a job description into a structured Job object
 */
const parseJd = async (req, res, next) => {
    try {
        const { text, url, company, role } = req.body;
        if (!text && !url) {
            throw new ApiError(400, 'Please provide job description text or web URL');
        }

        // Mock JD extraction baseline if URL parsing is requested
        const rawJdText = text || `Company: Google\nRole: Frontend Developer\nExperience: 2+ years\nRequired Skills: React, TypeScript, HTML, CSS\nPreferred Skills: Redux, TailwindCSS`;

        const words = rawJdText.toLowerCase().split(/\W+/);
        const allSkills = ['react', 'typescript', 'javascript', 'python', 'docker', 'aws', 'kubernetes', 'node.js', 'django', 'postgresql', 'mongodb', 'html', 'css', 'git'];
        
        const requiredSkills = [];
        allSkills.forEach(s => {
            if (words.includes(s.replace('.', ''))) {
                requiredSkills.push(s.charAt(0).toUpperCase() + s.slice(1));
            }
        });

        const structuredJob = {
            company: company || 'Tech Company',
            role: role || 'Software Engineer',
            experience: '0-2 years',
            requiredSkills: requiredSkills.length > 0 ? requiredSkills : ['Javascript', 'React'],
            preferredSkills: ['TypeScript', 'Git'],
            softSkills: ['Communication', 'Teamwork'],
            projectsExpected: { count: 2, description: 'Demonstrated front-end state management projects' },
            tools: ['VS Code', 'Git'],
            frameworks: ['React', 'Next.js'],
            responsibilities: ['Build high-performance web applications', 'Collaborate with UX designer assets'],
            qualifications: ['Bachelor degree in Computer Science or related fields']
        };

        res.status(200).json({
            success: true,
            data: {
                job: structuredJob
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/resume/diff
 * Compare two resume version snapshots
 */
const diffResumes = async (req, res, next) => {
    try {
        const { oldVersion, newVersion } = req.body;
        if (!oldVersion || !newVersion) {
            throw new ApiError(400, 'Please provide oldVersion and newVersion numbers');
        }

        const oldSnapshot = await ResumeVersion.findOne({ user: req.user._id, version: oldVersion });
        const newSnapshot = await ResumeVersion.findOne({ user: req.user._id, version: newVersion });

        if (!oldSnapshot || !newSnapshot) {
            throw new ApiError(404, 'One or both of the version snapshots could not be found');
        }

        const diffReport = compareVersions(oldSnapshot, newSnapshot);

        res.status(200).json({
            success: true,
            data: diffReport
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/resume/history
 * Fetch historical timeline snapshots for charting
 */
const getResumeHistory = async (req, res, next) => {
    try {
        const timeline = await HistoryTimeline.findOne({ user: req.user._id });
        const versions = await ResumeVersion.find({ user: req.user._id }).sort({ version: 1 });

        // If timeline doc is empty, compile it from version records dynamically
        const scores = timeline?.scores || versions.map(v => ({
            readinessScore: v.readinessScore || 70,
            atsScore: v.atsScore || 65,
            githubScore: v.githubSnapshot?.githubScore || 60,
            projectsScore: v.categoryScores?.projects || 70,
            timestamp: v.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                scores
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/resume/version/:id
 * Retrieve details of a specific version snapshot
 */
const getResumeVersion = async (req, res, next) => {
    try {
        const snapshot = await ResumeVersion.findById(req.params.id);
        if (!snapshot) throw new ApiError(404, 'Version snapshot not found');

        res.status(200).json({
            success: true,
            data: {
                snapshot
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/benchmark
 * Retrieve target role benchmark metrics
 */
const getBenchmark = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const readiness = await PlacementReadiness.findOne({ user: req.user._id })
            .sort({ createdAt: -1 });

        const targetRole = readiness?.targetRole || user.targetRole || 'Software Engineer';
        const candidateScore = readiness?.readinessScore || 70;

        const stats = await getBenchmarkStats(targetRole, candidateScore);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/confidence
 * Retrieve confidence indicators for candidate skills
 */
const getConfidence = async (req, res, next) => {
    try {
        const readiness = await PlacementReadiness.findOne({ user: req.user._id })
            .sort({ createdAt: -1 });

        if (!readiness) {
            throw new ApiError(404, 'No placement readiness data found');
        }

        const skillsConfidence = [];
        (readiness.parsedResume?.skills || []).forEach(skill => {
            const hasGithub = readiness.githubAnalysis?.languages?.some(l => l.toLowerCase() === skill.toLowerCase());
            const hasProjects = readiness.parsedResume?.projects?.some(p => p.technologies?.some(t => t.toLowerCase() === skill.toLowerCase()));
            
            let score = 30;
            const evidence = [];

            if (hasGithub) {
                score += 40;
                evidence.push('GitHub repository codebase activity');
            }
            if (hasProjects) {
                score += 25;
                evidence.push('Resume projects section references');
            }
            if (score > 30) {
                evidence.push('Parsing extraction keywords matching');
            }

            skillsConfidence.push({
                skill,
                confidence: score,
                evidence,
                rating: score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low'
            });
        });

        res.status(200).json({
            success: true,
            data: {
                skills: skillsConfidence
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/semantic-match
 * Calculate semantic overlays between latest resume and target JobRole description
 */
const getSemanticMatch = async (req, res, next) => {
    try {
        const { targetRole } = req.query;
        const target = targetRole || 'Software Engineer';

        const readiness = await PlacementReadiness.findOne({ user: req.user._id })
            .sort({ createdAt: -1 });

        if (!readiness) {
            throw new ApiError(404, 'No parsed resume profile found. Please upload a resume first.');
        }

        let jobRole = await JobRole.findOne({ title: target });
        if (!jobRole) jobRole = await JobRole.findOne({ title: 'Software Engineer' });

        const jdMock = `Target Career: ${jobRole.title}. Expected Tech: ${jobRole.requiredSkills.join(', ')}. Tools: ${jobRole.expectedTools.join(', ')}`;
        const matchStats = await matchSemantically(
            readiness.parsedResume?.personal?.name || 'Candidate text profile',
            jdMock,
            readiness.parsedResume?.skills || []
        );

        res.status(200).json({
            success: true,
            data: matchStats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/ats/report
 * Return printable ATS overview report
 */
const getAtsReport = async (req, res, next) => {
    try {
        const readiness = await PlacementReadiness.findOne({ user: req.user._id })
            .sort({ createdAt: -1 });

        if (!readiness) {
            throw new ApiError(404, 'No analyzed resume profile found');
        }

        const report = analyzeResumeAts(
            readiness.parsedResume, 
            JSON.stringify(readiness.parsedResume), 
            readiness.skillGap?.strongSkills || []
        );

        res.status(200).json({
            success: true,
            data: {
                candidateName: readiness.parsedResume?.personal?.name || req.user.name,
                targetRole: readiness.targetRole,
                overallAtsScore: report.overallAtsScore,
                sectionScores: report.sectionScores,
                fixes: report.priorityFixes
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    analyzeAts,
    parseJd,
    diffResumes,
    getResumeHistory,
    getResumeVersion,
    getBenchmark,
    getConfidence,
    getSemanticMatch,
    getAtsReport
};
