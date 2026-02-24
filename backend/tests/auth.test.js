/**
 * Auth Controller Unit Tests
 * 
 * Tests for user registration, login, token refresh, and profile management.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

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
});

describe('POST /api/v1/auth/register', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.name).toBe(validUser.name);
    // Should set cookies
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'notanemail' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, password: '123' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  const user = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!',
  };

  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(user);
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'noone@example.com', password: 'Test123!' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return user profile when authenticated', async () => {
    const user = { name: 'Test User', email: 'test@example.com', password: 'Test123!' };
    const registerRes = await request(app).post('/api/v1/auth/register').send(user);
    const cookies = registerRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
  });

  it('should reject unauthenticated requests', async () => {
    await request(app)
      .get('/api/v1/auth/me')
      .expect(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should clear auth cookies', async () => {
    const user = { name: 'Test User', email: 'test@example.com', password: 'Test123!' };
    const registerRes = await request(app).post('/api/v1/auth/register').send(user);
    const cookies = registerRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe('PUT /api/v1/auth/profile', () => {
  it('should update profile fields', async () => {
    const user = { name: 'Test User', email: 'test@example.com', password: 'Test123!' };
    const registerRes = await request(app).post('/api/v1/auth/register').send(user);
    const cookies = registerRes.headers['set-cookie'];

    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Cookie', cookies)
      .send({ name: 'Updated Name', targetRole: 'Software Engineer' })
      .expect(200);

    expect(res.body.data.user.name).toBe('Updated Name');
    expect(res.body.data.user.targetRole).toBe('Software Engineer');
  });
});

describe('POST /api/v1/auth/forgot-password', () => {
  it('should always return success (security)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
