/**
 * User controller - Handles HTTP requests for user operations
 */
import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/response.util.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Register a new user
 * Sets JWT token in HTTP-only cookie
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, token } = await userService.registerUser(req.body);
    const { config } = await import('../config/config.js');

    // Set token in HTTP-only cookie
    res.cookie(config.cookie.name, token, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge,
    });

    // Return user data without token
    res.status(201).json(successResponse('User registered successfully', { user }));
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * Sets JWT token in HTTP-only cookie
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, token } = await userService.loginUser(req.body);
    const { config } = await import('../config/config.js');

    // Set token in HTTP-only cookie
    res.cookie(config.cookie.name, token, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge,
    });

    // Return user data without token
    res.status(200).json(successResponse('Login successful', { user }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const user = await userService.getUserById(req.user.userId);
    res.status(200).json(successResponse('Profile retrieved successfully', user));
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * Clears the authentication cookie
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { config } = await import('../config/config.js');

    // Clear the authentication cookie
    res.clearCookie(config.cookie.name, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    });

    res.status(200).json(successResponse('Logout successful'));
  } catch (error) {
    next(error);
  }
};
