/**
 * Advanced Placement Intelligence Engine Integration Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');
const JobRole = require('../src/models/JobRole');
const PlacementReadiness = require('../src/models/PlacementReadiness');
const ResumeVersion = require('../src/models/ResumeVersion');

let mongoServer;
let authCookies;
let testUser;
let testResume;
let oldVersionDoc;
let newVersionDoc;

jest.setTimeout(60000);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // 1. Create target JobRole
    await JobRole.create({
        title: 'Software Engineer',
        requiredSkills: ['Python', 'Javascript', 'Algorithms'],
        preferredSkills: ['Docker', 'Git'],
        softSkills: ['Problem Solving'],
        expectedProjects: { count: 2, description: 'Academic projects' },
        expectedExperience: '0-2 years',
        expectedTools: ['Git'],
        expectedTechnologies: ['React']
    });

    // 2. Register user to get cookies
    const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
            name: 'Intelligence Tester',
            email: 'tester@example.com',
            password: 'Password123!'
        });
    
    authCookies = regRes.headers['set-cookie'];
    testUser = await User.findOne({ email: 'tester@example.com' });

    // 3. Create test Resume
    testResume = await Resume.create({
        user: testUser._id,
        originalName: 'tester_resume.pdf',
        fileName: 'tester_resume.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        filePath: '/uploads/tester_resume.pdf',
        extractedText: 'Tester Candidate\ntester@example.com\nSkills: Python, Javascript, React, Docker, Git.\nProjects: Built microservices and UI sites.',
        status: 'analyzed'
    });

    // 4. Create Mock PlacementReadiness
    await PlacementReadiness.create({
        user: testUser._id,
        resume: testResume._id,
        targetRole: 'Software Engineer',
        parsedResume: {
            personal: { name: 'Tester Candidate', email: 'tester@example.com' },
            skills: ['Python', 'Javascript', 'React', 'Docker', 'Git'],
            projects: [{ name: 'Microservices Backend', technologies: ['Python', 'Docker'] }]
        },
        readinessScore: 78,
        categoryScores: {
            technicalSkills: 80,
            resumeQuality: 85,
            projects: 75,
            github: 70,
            experience: 80,
            consistency: 80
        }
    });

    // 5. Create ResumeVersion snapshots
    oldVersionDoc = await ResumeVersion.create({
        user: testUser._id,
        resume: testResume._id,
        version: 1,
        parsedResume: {
            skills: ['Python', 'Javascript']
        },
        readinessScore: 68,
        atsScore: 65,
        githubSnapshot: { githubScore: 60 }
    });

    newVersionDoc = await ResumeVersion.create({
        user: testUser._id,
        resume: testResume._id,
        version: 2,
        parsedResume: {
            skills: ['Python', 'Javascript', 'Docker', 'Git']
        },
        readinessScore: 78,
        atsScore: 74,
        githubSnapshot: { githubScore: 70 }
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Placement Intelligence API Suite (Sprint 2.5)', () => {
    it('POST /api/v1/ats/analyze should return complete ATS section scores', async () => {
        const res = await request(app)
            .post('/api/v1/ats/analyze')
            .set('Cookie', authCookies)
            .send({
                resumeId: testResume._id,
                targetRole: 'Software Engineer'
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.overallAtsScore).toBeGreaterThan(0);
        expect(res.body.data.sectionScores).toBeDefined();
        expect(res.body.data.priorityFixes.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/jd/parse should extract target Job details', async () => {
        const res = await request(app)
            .post('/api/v1/jd/parse')
            .set('Cookie', authCookies)
            .send({
                text: 'Google is hiring a Frontend Developer experienced in React and TypeScript.'
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.job.role).toBe('Software Engineer');
        expect(res.body.data.job.requiredSkills).toContain('React');
    });

    it('POST /api/v1/resume/diff should compare two snapshots', async () => {
        const res = await request(app)
            .post('/api/v1/resume/diff')
            .set('Cookie', authCookies)
            .send({
                oldVersion: 1,
                newVersion: 2
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.addedSkills).toContain('Docker');
        expect(res.body.data.scoreChanges.readiness).toBe(10);
    });

    it('GET /api/v1/resume/history should fetch progress runs', async () => {
        const res = await request(app)
            .get('/api/v1/resume/history')
            .set('Cookie', authCookies)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.scores.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/resume/version/:id should return single snapshot details', async () => {
        const res = await request(app)
            .get(`/api/v1/resume/version/${oldVersionDoc._id}`)
            .set('Cookie', authCookies)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.snapshot.version).toBe(1);
    });

    it('GET /api/v1/benchmark should return career benchmark percentiles', async () => {
        const res = await request(app)
            .get('/api/v1/benchmark')
            .set('Cookie', authCookies)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.benchmarks.topTenPercent).toBeDefined();
        expect(res.body.data.percentile).toBeDefined();
    });

    it('GET /api/v1/confidence should return skills evidence score cards', async () => {
        const res = await request(app)
            .get('/api/v1/confidence')
            .set('Cookie', authCookies)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.skills.length).toBeGreaterThan(0);
        expect(res.body.data.skills[0].confidence).toBeDefined();
    });

    it('GET /api/v1/semantic-match should output semantic and exact match coefficients', async () => {
        const res = await request(app)
            .get('/api/v1/semantic-match?targetRole=Software Engineer')
            .set('Cookie', authCookies)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.semantic_match_pct).toBeDefined();
        expect(res.body.data.exact_match_pct).toBeDefined();
    });

    it('GET /api/v1/ats/report should return comprehensive audit summary', async () => {
        const res = await request(app)
            .get('/api/v1/ats/report')
            .set('Cookie', authCookies)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.overallAtsScore).toBeDefined();
        expect(res.body.data.fixes).toBeDefined();
    });
});
