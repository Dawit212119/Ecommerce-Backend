/**
 * Authentication Endpoints Tests
 */
import request from 'supertest';
import express, { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../routes/auth.routes.js';
import { errorHandler } from '../middleware/error.middleware.js';
import * as userService from '../services/user.service.js';
import { hashPassword } from '../utils/password.util.js';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock user service
jest.mock('../services/user.service.js');

// Mock password utility
jest.mock('../utils/password.util.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  validatePasswordComplexity: jest.fn(),
}));

// Mock JWT utility
jest.mock('../utils/jwt.util.js', () => ({
  generateToken: jest.fn(() => 'mock-jwt-token'),
  verifyToken: jest.fn(),
}));

const app: Application = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

describe('POST /auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!@#',
    };

    const mockUser = {
      id: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    (userService.registerUser as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: 'mock-jwt-token',
    });

    const response = await request(app).post('/auth/register').send(userData).expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User registered successfully');
    expect(response.body.object.user).toMatchObject({
      username: userData.username,
      email: userData.email,
    });
    expect(response.body.object.token).toBeDefined();
  });

  it('should return 400 for invalid email format', async () => {
    const userData = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'Test123!@#',
    };

    const response = await request(app).post('/auth/register').send(userData).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return 400 for weak password', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'weak',
    };

    const response = await request(app).post('/auth/register').send(userData).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return 400 for non-alphanumeric username', async () => {
    const userData = {
      username: 'test-user!',
      email: 'test@example.com',
      password: 'Test123!@#',
    };

    const response = await request(app).post('/auth/register').send(userData).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return 400 for username too short', async () => {
    const userData = {
      username: 'ab',
      email: 'test@example.com',
      password: 'Test123!@#',
    };

    const response = await request(app).post('/auth/register').send(userData).expect(400);

    expect(response.body.success).toBe(false);
  });
});

describe('POST /auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login user successfully', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Test123!@#',
    };

    const mockUser = {
      id: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    (userService.loginUser as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: 'mock-jwt-token',
    });

    const response = await request(app).post('/auth/login').send(credentials).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.object.user).toMatchObject({
      email: credentials.email,
    });
    expect(response.body.object.token).toBeDefined();
  });

  it('should return 401 for invalid credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'WrongPassword123!',
    };

    const error = new Error('Invalid credentials') as Error & { statusCode?: number };
    error.statusCode = 401;

    (userService.loginUser as jest.Mock).mockRejectedValue(error);

    const response = await request(app).post('/auth/login').send(credentials).expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid credentials');
  });

  it('should return 400 for invalid email format', async () => {
    const credentials = {
      email: 'invalid-email',
      password: 'Test123!@#',
    };

    const response = await request(app).post('/auth/login').send(credentials).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return 400 for missing password', async () => {
    const credentials = {
      email: 'test@example.com',
    };

    const response = await request(app).post('/auth/login').send(credentials).expect(400);

    expect(response.body.success).toBe(false);
  });
});

