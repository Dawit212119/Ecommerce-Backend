/**
 * User controller - Handles HTTP requests for user operations
 */
import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/response.util.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, token } = await userService.registerUser(req.body);
    res.status(201).json(
      successResponse('User registered successfully', { user, token })
    );
  } catch (error) {
    next(error);
  }
};

// Login user

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, token } = await userService.loginUser(req.body);
    res.status(200).json(
      successResponse('Login successful', { user, token })
    );
  } catch (error) {
   
    next(error);
  }
};

// Get user profile
 
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const user = await userService.getUserById(req.user.userId);
    res.status(200).json(
      successResponse('Profile retrieved successfully', user)
    );
  } catch (error) {
    next(error);
  }
};


