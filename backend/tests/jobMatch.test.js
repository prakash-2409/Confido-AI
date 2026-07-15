/**
 * Job Match Intelligence Engine – Unit Tests
 * 
 * Tests:
 * - Protected route enforcement
 * - Full analysis pipeline (text-based JD)
 * - Match score validation (0-100 range)
 * - Gap analysis structure
 * - Hiring probability levels
 * - Improvement simulations sorted by impact
 * - Interview prediction structure
 * - History listing, retrieval, and deletion
 * - Fallback engine validation (no LLM keys)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const JobMatch = require('../src/models/JobMatch');
const Resume = require('../src/models/Resume');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    await JobMatch.deleteMany({});
    await Resume.deleteMany({});
});

// ── Sample JD for testing ──────────────────────────────────────────────────

const SAMPLE_JD = `
Senior Frontend Engineer at TechCorp

We are looking for a Senior Frontend Engineer with 5+ years of experience 
in building modern web applications.

Requirements:
- Strong proficiency in React, TypeScript, and JavaScript
- Experience with Next.js or similar SSR frameworks
- Familiarity with Node.js backend development
- Experience with REST APIs and GraphQL
- Knowledge of CSS-in-JS solutions (Styled Components, Emotion)
- Experience with testing frameworks (Jest, Cypress, Playwright)
- Git version control and CI/CD pipelines
- Strong communication and collaboration skills
- Bachelor's degree in Computer Science or related field

Responsibilities:
- Build and maintain user-facing features using React
- Collaborate with designers and backend engineers
- Write clean, maintainable, and well-tested code
- Participate in code reviews and architectural discussions
- Mentor junior developers

Nice to have:
- Experience with Docker and Kubernetes
- Knowledge of AWS or cloud platforms
- Experience with GraphQL and Apollo Client
`;

describe('Job Match Intelligence Engine', () => {
    const testUser = {
        name: 'Match Test User',
        email: 'matchtest@example.com',
        password: 'Password123!',
    };

    let cookies;
    let userId;

    beforeEach(async () => {
        // Register user and get auth cookies
        const registerRes = await request(app)
            .post('/api/v1/auth/register')
            .send(testUser);
        cookies = registerRes.headers['set-cookie'];
        userId = registerRes.body.data?.user?._id || registerRes.body.data?.user?.id;

        // Create a test resume for the user
        const user = await User.findOne({ email: testUser.email });
        if (user) {
            userId = user._id;
            await Resume.create({
                user: user._id,
                originalName: 'test-resume.pdf',
                fileName: `test-${Date.now()}.pdf`,
                fileType: 'application/pdf',
                fileSize: 1024,
                filePath: '/tmp/test-resume.pdf',
                extractedText: 'Experienced frontend developer with 3 years of experience in React, JavaScript, TypeScript, HTML, CSS. Built multiple web applications using Next.js and Node.js. Familiar with Git, REST APIs, and MongoDB.',
                status: 'analyzed',
                atsScore: 72,
                skills: ['react', 'javascript', 'typescript', 'html', 'css', 'next.js', 'node.js', 'git', 'rest', 'mongodb'],
                missingKeywords: ['graphql', 'docker', 'kubernetes'],
            });

            // Update user profile for richer matching
            user.currentRole = 'Frontend Developer';
            user.targetRole = 'Senior Frontend Engineer';
            user.experienceYears = 3;
            user.profileCompleteness = 70;
            await user.save();
        }
    });

    // ── Route Protection ──────────────────────────────────────────────────

    describe('Authentication', () => {
        it('should reject unauthenticated POST /api/v1/job-match/analyze', async () => {
            await request(app)
                .post('/api/v1/job-match/analyze')
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(401);
        });

        it('should reject unauthenticated GET /api/v1/job-match', async () => {
            await request(app)
                .get('/api/v1/job-match')
                .expect(401);
        });

        it('should reject unauthenticated DELETE /api/v1/job-match/123', async () => {
            await request(app)
                .delete('/api/v1/job-match/123')
                .expect(401);
        });
    });

    // ── Input Validation ──────────────────────────────────────────────────

    describe('Input Validation', () => {
        it('should reject empty job description', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: '' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('50 characters');
        });

        it('should reject job description shorter than 50 characters', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: 'Short JD' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    // ── Full Analysis Pipeline ────────────────────────────────────────────

    describe('POST /api/v1/job-match/analyze', () => {
        it('should complete full analysis pipeline with valid JD', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({
                    jobDescriptionText: SAMPLE_JD,
                    jobTitle: 'Senior Frontend Engineer',
                    company: 'TechCorp',
                })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.jobMatch).toBeDefined();

            const match = res.body.data.jobMatch;
            expect(match.status).toBe('completed');
            expect(match.jobTitle).toBe('Senior Frontend Engineer');
            expect(match.company).toBe('TechCorp');
        }, 30000);

        it('should return overall match score between 0-100', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const score = res.body.data.jobMatch.matchResult.overallScore;
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        }, 30000);

        it('should return valid category scores', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const categories = res.body.data.jobMatch.matchResult.categoryScores;
            expect(categories).toBeDefined();
            ['skills', 'experience', 'tools', 'education'].forEach(cat => {
                expect(categories[cat]).toBeGreaterThanOrEqual(0);
                expect(categories[cat]).toBeLessThanOrEqual(100);
            });
        }, 30000);

        it('should return matched and missing skill arrays', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const mr = res.body.data.jobMatch.matchResult;
            expect(Array.isArray(mr.matchedSkills)).toBe(true);
            expect(Array.isArray(mr.missingSkills)).toBe(true);
            // Our test resume has react, typescript, javascript - should match some
            expect(mr.matchedSkills.length + mr.missingSkills.length).toBeGreaterThan(0);
        }, 30000);

        it('should return gap analysis with prioritized items', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const ga = res.body.data.jobMatch.gapAnalysis;
            expect(ga).toBeDefined();
            expect(Array.isArray(ga.missingSkills)).toBe(true);
            expect(Array.isArray(ga.missingTechnologies)).toBe(true);
            expect(Array.isArray(ga.missingExperience)).toBe(true);
            expect(Array.isArray(ga.missingInterviewPrep)).toBe(true);

            // Each missing skill should have importance field
            if (ga.missingSkills.length > 0) {
                expect(['critical', 'important', 'nice_to_have']).toContain(ga.missingSkills[0].importance);
            }
        }, 30000);

        it('should return valid hiring probability', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const hp = res.body.data.jobMatch.hiringProbability;
            expect(hp).toBeDefined();
            expect(['low', 'medium', 'high']).toContain(hp.level);
            expect(hp.percentage).toBeGreaterThanOrEqual(0);
            expect(hp.percentage).toBeLessThanOrEqual(100);
            expect(Array.isArray(hp.reasoning)).toBe(true);
            expect(Array.isArray(hp.topBlockers)).toBe(true);
        }, 30000);

        it('should return improvement simulations sorted by impact', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const sims = res.body.data.jobMatch.improvementSimulations;
            expect(Array.isArray(sims)).toBe(true);

            // Verify sorted by impact descending
            for (let i = 1; i < sims.length; i++) {
                expect(sims[i - 1].impact).toBeGreaterThanOrEqual(sims[i].impact);
            }

            // Each simulation has required fields
            if (sims.length > 0) {
                expect(sims[0].action).toBeDefined();
                expect(typeof sims[0].currentScore).toBe('number');
                expect(typeof sims[0].projectedScore).toBe('number');
                expect(typeof sims[0].impact).toBe('number');
            }
        }, 30000);

        it('should return interview predictions', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const ip = res.body.data.jobMatch.interviewPrediction;
            expect(ip).toBeDefined();
            expect(Array.isArray(ip.likelyTopics)).toBe(true);
            expect(Array.isArray(ip.predictedQuestions)).toBe(true);
            expect(Array.isArray(ip.preparationTips)).toBe(true);

            // Predicted questions have required structure
            if (ip.predictedQuestions.length > 0) {
                const q = ip.predictedQuestions[0];
                expect(q.question).toBeDefined();
                expect(['technical', 'behavioral', 'situational', 'system_design']).toContain(q.category);
                expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
            }
        }, 30000);

        it('should extract experience requirements from JD', async () => {
            const res = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const reqs = res.body.data.jobMatch.extractedRequirements;
            expect(reqs).toBeDefined();
            expect(Array.isArray(reqs.skills)).toBe(true);
            expect(reqs.skills.length).toBeGreaterThan(0);
            expect(reqs.experience).toBeDefined();
        }, 30000);
    });

    // ── CRUD Operations ───────────────────────────────────────────────────

    describe('GET /api/v1/job-match', () => {
        it('should return empty list for new user', async () => {
            const res = await request(app)
                .get('/api/v1/job-match')
                .set('Cookie', cookies)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.count).toBe(0);
            expect(Array.isArray(res.body.data.matches)).toBe(true);
        });

        it('should list analyses after running one', async () => {
            // Run an analysis first
            await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const res = await request(app)
                .get('/api/v1/job-match')
                .set('Cookie', cookies)
                .expect(200);

            expect(res.body.data.count).toBe(1);
            expect(res.body.data.matches[0].matchResult).toBeDefined();
        }, 30000);
    });

    describe('GET /api/v1/job-match/:id', () => {
        it('should return 404 for non-existent analysis', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/api/v1/job-match/${fakeId}`)
                .set('Cookie', cookies)
                .expect(404);
        });

        it('should return full analysis details by ID', async () => {
            const createRes = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const matchId = createRes.body.data.jobMatch._id;

            const res = await request(app)
                .get(`/api/v1/job-match/${matchId}`)
                .set('Cookie', cookies)
                .expect(200);

            expect(res.body.data.jobMatch._id).toBe(matchId);
            expect(res.body.data.jobMatch.jobDescriptionText).toBeDefined();
        }, 30000);
    });

    describe('DELETE /api/v1/job-match/:id', () => {
        it('should delete an analysis', async () => {
            const createRes = await request(app)
                .post('/api/v1/job-match/analyze')
                .set('Cookie', cookies)
                .send({ jobDescriptionText: SAMPLE_JD })
                .expect(201);

            const matchId = createRes.body.data.jobMatch._id;

            await request(app)
                .delete(`/api/v1/job-match/${matchId}`)
                .set('Cookie', cookies)
                .expect(200);

            // Verify it's gone
            await request(app)
                .get(`/api/v1/job-match/${matchId}`)
                .set('Cookie', cookies)
                .expect(404);
        }, 30000);

        it('should return 404 when deleting non-existent analysis', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .delete(`/api/v1/job-match/${fakeId}`)
                .set('Cookie', cookies)
                .expect(404);
        });
    });

    // ── Service Layer Direct Tests ────────────────────────────────────────

    describe('Service: jobMatchService', () => {
        const {
            extractJobRequirements,
            computeMatchScore,
            generateGapAnalysis,
            computeHiringProbability,
            simulateImprovements,
        } = require('../src/services/jobMatchService');

        const mockContext = {
            user: {
                name: 'Test',
                currentRole: 'Developer',
                targetRole: 'Senior Developer',
                experienceYears: 3,
                profileCompleteness: 70,
                careerReadiness: 50,
                missingSkills: [],
            },
            resume: {
                hasResume: true,
                atsScore: 72,
                skills: ['react', 'javascript', 'typescript', 'node.js', 'git'],
                missingKeywords: ['graphql', 'docker'],
            },
            roadmap: { hasRoadmap: false, completionPercentage: 0, milestones: [] },
            interviews: { count: 0, averageScore: 0, strengths: [], weaknesses: [], hasInterviews: false },
        };

        it('extractJobRequirements should extract skills from text', async () => {
            const reqs = await extractJobRequirements(SAMPLE_JD);
            expect(reqs.skills.length).toBeGreaterThan(0);
            expect(Array.isArray(reqs.tools)).toBe(true);
            expect(reqs.experience).toBeDefined();
        });

        it('computeMatchScore should return valid weighted score', () => {
            const reqs = {
                skills: ['react', 'typescript', 'python', 'graphql', 'docker'],
                experience: { minYears: 5, maxYears: null, level: 'senior' },
                education: [],
                tools: ['docker', 'git', 'aws'],
                certifications: [],
            };

            const result = computeMatchScore(mockContext, reqs);
            expect(result.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.overallScore).toBeLessThanOrEqual(100);
            expect(result.matchedSkills.length + result.missingSkills.length).toBe(reqs.skills.length);
        });

        it('generateGapAnalysis should prioritize missing skills', () => {
            const matchResult = {
                overallScore: 55,
                categoryScores: { skills: 60, experience: 40, tools: 50, education: 50 },
                matchedSkills: ['react', 'typescript'],
                missingSkills: ['python', 'graphql', 'docker', 'kubernetes'],
                matchedTools: ['git'],
                missingTools: ['aws', 'docker'],
                experienceMatch: { required: '5+ years', actual: '3 years', verdict: 'below' },
                educationMatch: { required: ['CS degree'], actual: 'Developer', verdict: 'unknown' },
            };
            const reqs = { responsibilities: ['Build APIs', 'Lead team'] };

            const gaps = generateGapAnalysis(matchResult, mockContext, reqs);
            expect(gaps.missingSkills.length).toBeGreaterThan(0);
            // First items should be critical
            const importanceLevels = gaps.missingSkills.map(s => s.importance);
            expect(importanceLevels).toContain('critical');
        });

        it('computeHiringProbability should return valid level', () => {
            const matchResult = { overallScore: 55, matchedSkills: ['a', 'b'], missingSkills: ['c'], experienceMatch: { verdict: 'below', required: '5', actual: '3' } };
            const gapAnalysis = { missingSkills: [{ skill: 'c', importance: 'critical' }] };

            const hp = computeHiringProbability(matchResult, gapAnalysis, mockContext);
            expect(['low', 'medium', 'high']).toContain(hp.level);
            expect(hp.percentage).toBeGreaterThanOrEqual(0);
            expect(hp.percentage).toBeLessThanOrEqual(100);
        });

        it('simulateImprovements should sort by impact descending', () => {
            const matchResult = {
                overallScore: 50,
                categoryScores: { skills: 50, experience: 40, tools: 30, education: 50 },
                matchedSkills: ['react'],
                missingSkills: ['python', 'graphql', 'docker'],
                matchedTools: ['git'],
                missingTools: ['aws', 'k8s'],
                experienceMatch: { verdict: 'below' },
            };
            const gapAnalysis = {
                missingSkills: [
                    { skill: 'python', importance: 'critical', estimatedLearningTime: '2-4 weeks' },
                    { skill: 'graphql', importance: 'important', estimatedLearningTime: '1-2 weeks' },
                ],
                missingTechnologies: [
                    { tech: 'aws', importance: 'critical' },
                ],
            };

            const sims = simulateImprovements(matchResult, gapAnalysis);
            expect(sims.length).toBeGreaterThan(0);
            for (let i = 1; i < sims.length; i++) {
                expect(sims[i - 1].impact).toBeGreaterThanOrEqual(sims[i].impact);
            }
        });
    });
});
