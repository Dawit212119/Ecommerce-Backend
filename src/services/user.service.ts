/**
 * User service - Business logic for user operations
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';

const prisma = new PrismaClient();

export interface RegisterUserData {
  username: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

// Register a new user

export const registerUser = async (userData: RegisterUserData): Promise<AuthResponse> => {
  const { username, email, password } = userData;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('Email is already registered');
    }
    if (existingUser.username === username) {
      throw new Error('Username is already taken');
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  // Generate token with userId and username (User Story 2)
  const token = generateToken(user.id, user.username, user.email);

  return {
    user,
    token,
  };
};

// Login user

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error('Invalid credentials') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    const error = new Error('Invalid credentials') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user.id, user.username, user.email);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

// Get user profile by ID

export const getUserById = async (userId: string): Promise<UserResponse & { updatedAt: Date }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};
