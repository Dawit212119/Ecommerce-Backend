// Authentication middleware for protecting routes

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/response.util.js';
import { config } from '../config/config.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
  file?: Express.Multer.File;
}

// Middleware to authenticate requests using JWT from cookies

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Try to get token from cookie first
    let token = req.cookies?.[config.cookie.name];
    
    // Fallback to Authorization header for backward compatibility
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      res.status(401).json(errorResponse('Authentication required. Please login to continue.'));
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json(errorResponse('Invalid or expired token. Please login again.'));
      return;
    }

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email || '',
      username: decoded.username,
    };

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(401).json(errorResponse('Authentication failed.', [errorMessage]));
  }
};
