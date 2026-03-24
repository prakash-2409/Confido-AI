/**
 * Health & Resume Routes Unit Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('GET /health', () => {
  it('should return healthy status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.uptime).toBeDefined();
  });
});

describe('GET /health/db', () => {
  it('should return database health', async () => {
    const res = await request(app)
      .get('/health/db')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.database).toBe('connected');
  });
});

describe('GET /', () => {
  it('should return welcome message', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Career AI');
  });
});

describe('Resume Routes - Auth', () => {
  it('should reject unauthenticated resume upload', async () => {
    await request(app)
      .post('/api/v1/resume/upload')
      .expect(401);
  });

  it('should reject unauthenticated resume list', async () => {
    await request(app)
      .get('/api/v1/resume')
      .expect(401);
  });
});

describe('Interview Routes - Auth', () => {
  it('should reject unauthenticated interview start', async () => {
    await request(app)
      .post('/api/v1/interview/start')
      .expect(401);
  });

  it('should reject unauthenticated interview history', async () => {
    await request(app)
      .get('/api/v1/interview/history')
      .expect(401);
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});
