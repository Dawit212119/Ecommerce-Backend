// User routes
 
import express, { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router: Router = express.Router();

/**
 * @route   POST /api/users/login
 * @desc    Login user (legacy endpoint - use /auth/login instead)
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  userController.login
);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  userController.getProfile
);

export default router;


