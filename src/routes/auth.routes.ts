/**
 * Authentication routes - Define all auth-related endpoints
 */
import express, { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { validatePasswordComplexity } from '../utils/password.util.js';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

/**
 * Custom validator to check if email already exists
 */
const checkEmailExists = async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  return !!user;
};

/**
 * Custom validator to check if username already exists
 */
const checkUsernameExists = async (username: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { username }
  });
  return !!user;
};

/**
 * Custom password validator for User Story 1 requirements
 */
const validatePassword = (value: string) => {
  const result = validatePasswordComplexity(value);
  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
  return true;
};

/**
 * @route   POST /auth/register
 * @desc    Register a new user (User Story 1)
 * @access  Public
 */
router.post(
  '/register',
  [
    // Username validation: alphanumeric only, required, unique
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isAlphanumeric()
      .withMessage('Username must be alphanumeric (letters and numbers only, no special characters or spaces)')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .custom(async (value: string) => {
        const exists = await checkUsernameExists(value);
        if (exists) {
          throw new Error('Username is already taken');
        }
        return true;
      }),

    // Email validation: valid format, required, unique
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address format (e.g., user@example.com)')
      .normalizeEmail()
      .custom(async (value: string) => {
        const exists = await checkEmailExists(value);
        if (exists) {
          throw new Error('Email is already registered');
        }
        return true;
      }),

    // Password validation: complexity requirements
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .custom(validatePassword)
  ],
  validate,
  userController.register
);

/**
 * @route   POST /auth/login
 * @desc    Login user (User Story 2)
 * @access  Public
 */
router.post(
  '/login',
  [
    // User Story 2: Email validation - must be valid format
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address format')
      .normalizeEmail(),

    // User Story 2: Password is required
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  userController.login
);

export default router;
