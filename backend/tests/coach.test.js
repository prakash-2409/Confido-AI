/**
 * AI Career Coach Routes & Service Unit Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const CoachChat = require('../src/models/CoachChat');
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
  await CoachChat.deleteMany({});
  await Resume.deleteMany({});
});

describe('AI Career Coach Routes', () => {
  const testUser = {
    name: 'Coach Test User',
    email: 'coachtest@example.com',
    password: 'Password123!',
  };

  let cookies;

  beforeEach(async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    cookies = registerRes.headers['set-cookie'];
  });

  describe('GET /api/v1/coach/history', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/v1/coach/history')
        .expect(401);
    });

    it('should return empty history for a new user', async () => {
      const res = await request(app)
        .get('/api/v1/coach/history')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.messages).toBeDefined();
      expect(res.body.data.messages.length).toBe(0);
    });
  });

  describe('POST /api/v1/coach/message', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/v1/coach/message')
        .send({ message: 'Hello' })
        .expect(401);
    });

    it('should accept message and return assistant text response', async () => {
      const res = await request(app)
        .post('/api/v1/coach/message')
        .set('Cookie', cookies)
        .send({ message: 'Hello Coach!' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.response).toBeDefined();
      expect(res.body.data.messages.length).toBe(2); // User + assistant
      expect(res.body.data.messages[0].sender).toBe('user');
      expect(res.body.data.messages[1].sender).toBe('assistant');
    });

    it('should handle resume_improvement action and return structured data', async () => {
      // Find the user to get their ID
      const user = await User.findOne({ email: testUser.email });
      
      // Create a mock analyzed resume
      await Resume.create({
        user: user._id,
        originalName: 'test_resume.pdf',
        fileName: 'test_resume_123.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        filePath: '/uploads/test_resume_123.pdf',
        extractedText: 'Experience: Worked on a web application. Responsible for writing backend APIs.',
        atsScore: 70,
        skills: ['JavaScript', 'Node.js'],
        missingKeywords: ['Docker', 'Kubernetes'],
        status: 'analyzed'
      });

      const res = await request(app)
        .post('/api/v1/coach/message')
        .set('Cookie', cookies)
        .send({ action: 'resume_improvement' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message.type).toBe('resume_improvement');
      expect(res.body.data.message.data).not.toBeNull();
      expect(res.body.data.message.data.weakBullets).toBeDefined();
    });

    it('should handle project_recommendations action and return structured list', async () => {
      const res = await request(app)
        .post('/api/v1/coach/message')
        .set('Cookie', cookies)
        .send({ action: 'project_recommendations' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message.type).toBe('project_recommendations');
      expect(res.body.data.message.data.recommendations).toBeDefined();
      expect(res.body.data.message.data.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle readiness_check action and return readiness metrics', async () => {
      const res = await request(app)
        .post('/api/v1/coach/message')
        .set('Cookie', cookies)
        .send({ action: 'readiness_check' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message.type).toBe('readiness_check');
      expect(res.body.data.message.data.overallReadiness).toBeDefined();
      expect(res.body.data.message.data.weakestArea).toBeDefined();
    });
  });

  describe('POST /api/v1/coach/clear', () => {
    it('should clear chat history', async () => {
      // Send a message first
      await request(app)
        .post('/api/v1/coach/message')
        .set('Cookie', cookies)
        .send({ message: 'Hello' });

      // Clear history
      const clearRes = await request(app)
        .post('/api/v1/coach/clear')
        .set('Cookie', cookies)
        .expect(200);

      expect(clearRes.body.success).toBe(true);

      // Verify history is empty
      const historyRes = await request(app)
        .get('/api/v1/coach/history')
        .set('Cookie', cookies);

      expect(historyRes.body.data.messages.length).toBe(0);
    });
  });
});
