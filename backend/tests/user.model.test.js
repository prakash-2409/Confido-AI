/**
 * User Model Unit Tests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

afterEach(async () => {
  await User.deleteMany({});
});

describe('User Model', () => {
  const validUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePass123',
  };

  it('should create a user with valid fields', async () => {
    const user = await User.create(validUser);
    expect(user.name).toBe(validUser.name);
    expect(user.email).toBe(validUser.email);
    expect(user.isEmailVerified).toBe(false);
    expect(user.role).toBe('user');
    expect(user.subscription.plan).toBe('free');
    expect(user.profileCompleteness).toBe(30);
  });

  it('should hash password before saving', async () => {
    const user = await User.create(validUser);
    const fullUser = await User.findById(user._id).select('+password');
    expect(fullUser.password).not.toBe(validUser.password);
    expect(fullUser.password).toMatch(/^\$2[ab]\$/);
  });

  it('should compare password correctly', async () => {
    const user = await User.create(validUser);
    const fullUser = await User.findById(user._id).select('+password');
    
    const isMatch = await fullUser.comparePassword('securePass123');
    expect(isMatch).toBe(true);

    const isWrong = await fullUser.comparePassword('wrongPassword');
    expect(isWrong).toBe(false);
  });

  it('should reject duplicate email', async () => {
    await User.create(validUser);
    await expect(User.create(validUser)).rejects.toThrow();
  });

  it('should reject invalid email', async () => {
    await expect(User.create({ ...validUser, email: 'notanemail' })).rejects.toThrow();
  });

  it('should reject short name', async () => {
    await expect(User.create({ ...validUser, name: 'J' })).rejects.toThrow();
  });

  it('should reject short password', async () => {
    await expect(User.create({ ...validUser, password: '123' })).rejects.toThrow();
  });

  it('should manage refresh tokens', async () => {
    const user = await User.create(validUser);
    
    user.addRefreshToken('token1', 7 * 24 * 60 * 60 * 1000);
    user.addRefreshToken('token2', 7 * 24 * 60 * 60 * 1000);
    await user.save();
    
    expect(user.refreshTokens).toHaveLength(2);

    user.removeRefreshToken('token1');
    expect(user.refreshTokens).toHaveLength(1);
    expect(user.refreshTokens[0].token).toBe('token2');
  });

  it('should limit refresh tokens to 5', async () => {
    const user = await User.create(validUser);
    
    for (let i = 0; i < 7; i++) {
      user.addRefreshToken(`token${i}`, 7 * 24 * 60 * 60 * 1000);
    }
    await user.save();
    
    expect(user.refreshTokens.length).toBeLessThanOrEqual(5);
  });

  it('should remove expired tokens', async () => {
    const user = await User.create(validUser);
    
    // Add an expired token
    user.refreshTokens.push({
      token: 'expired',
      createdAt: new Date(Date.now() - 10000),
      expiresAt: new Date(Date.now() - 5000), // Already expired
    });
    
    // Add a valid token
    user.addRefreshToken('valid', 7 * 24 * 60 * 60 * 1000);
    
    user.removeExpiredTokens();
    expect(user.refreshTokens).toHaveLength(1);
    expect(user.refreshTokens[0].token).toBe('valid');
  });

  it('should find user by email (case-insensitive)', async () => {
    await User.create(validUser);
    const found = await User.findByEmail('JOHN@EXAMPLE.COM');
    expect(found).toBeTruthy();
    expect(found.email).toBe('john@example.com');
  });

  it('should strip sensitive fields from JSON', async () => {
    const user = await User.create(validUser);
    const json = user.toJSON();
    
    expect(json.password).toBeUndefined();
    expect(json.refreshTokens).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.emailVerificationCode).toBeUndefined();
    expect(json.passwordResetToken).toBeUndefined();
  });
});
