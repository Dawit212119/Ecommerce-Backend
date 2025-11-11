// Authentication middleware for protecting routes

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/response.util.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
  file?: Express.Multer.File;
}

// Middleware to authenticate requests using JWT

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('Authentication required. Please provide a valid token.'));
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json(errorResponse('Invalid or expired token.'));
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
