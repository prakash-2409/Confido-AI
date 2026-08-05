/**
 * Placement Readiness Pipeline Unit Tests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');
const JobRole = require('../src/models/JobRole');
const PlacementReadiness = require('../src/models/PlacementReadiness');
const { runPlacementReadinessPipeline } = require('../src/services/readinessPipeline');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Seed target JobRole for testing
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
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    await Resume.deleteMany({});
    await PlacementReadiness.deleteMany({});
});

describe('Placement Readiness Intelligence Pipeline', () => {
    it('should successfully run pipeline and compute weighted scores, gaps, and recommendations', async () => {
        // 1. Create a test candidate user
        const user = await User.create({
            name: 'Jane Student',
            email: 'jane@example.com',
            password: 'password123',
            githubUrl: 'https://github.com/janestudent'
        });

        // 2. Create a test resume document containing structured text content
        const resume = await Resume.create({
            user: user._id,
            originalName: 'jane_resume.pdf',
            fileName: 'jane_resume.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
            filePath: '/uploads/jane_resume.pdf',
            extractedText: 'Jane Student\njane@example.com\nSkills: Python, Javascript, React, HTML, CSS.\nProjects: Built a microservice API and a client dashboard.\nEducation: University of Technology, GPA: 9.0/10.',
            status: 'analyzed'
        });

        // 3. Trigger the intelligence pipeline
        const readinessDoc = await runPlacementReadinessPipeline(user._id, resume._id, 'Software Engineer');

        // 4. Assertions on scores
        expect(readinessDoc).toBeDefined();
        expect(readinessDoc.user.toString()).toBe(user._id.toString());
        expect(readinessDoc.targetRole).toBe('Software Engineer');
        expect(readinessDoc.readinessScore).toBeGreaterThan(0);
        expect(readinessDoc.readinessScore).toBeLessThanOrEqual(100);

        // 5. Assertions on category breakdowns
        expect(readinessDoc.categoryScores).toBeDefined();
        expect(readinessDoc.categoryScores.technicalSkills).toBeGreaterThanOrEqual(0);
        expect(readinessDoc.categoryScores.resumeQuality).toBeGreaterThan(0);

        // 6. Assertions on Skill Gap analysis
        expect(readinessDoc.skillGap).toBeDefined();
        expect(readinessDoc.skillGap.strongSkills).toContain('Python');
        expect(readinessDoc.skillGap.strongSkills).toContain('Javascript');
        expect(readinessDoc.skillGap.missingSkills.some(m => m.name === 'Algorithms')).toBe(true);

        // 7. Assertions on Evidence Mapping
        expect(readinessDoc.evidence).toBeDefined();
        expect(readinessDoc.evidence.length).toBeGreaterThan(0);
        expect(readinessDoc.evidence[0].evidenceList.length).toBeGreaterThan(0);

        // 8. Assertions on AI recommendations & roadmap
        expect(readinessDoc.recommendations).toBeDefined();
        expect(readinessDoc.recommendations.roadmap.weeklyGoals.length).toBeGreaterThan(0);
        expect(readinessDoc.recommendations.roadmap.thirtyDayPlan.length).toBeGreaterThan(0);

        // 9. Assertions on User profile updates
        const updatedUser = await User.findById(user._id);
        expect(updatedUser.careerReadiness).toBe(readinessDoc.readinessScore);
        expect(updatedUser.targetRole).toBe('Software Engineer');
        expect(updatedUser.missingSkills.some(s => s.skillName === 'Algorithms')).toBe(true);
    });
});
