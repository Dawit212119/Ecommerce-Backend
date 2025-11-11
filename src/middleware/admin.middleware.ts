/**
 * Admin authorization middleware
 * User Story 3: Protects routes that require Admin role
 */
import { Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util.js';
import { AuthRequest } from './auth.middleware.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware to check if user has Admin role

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json(
        errorResponse('Authentication required. Please provide a valid token.')
      );
      return;
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true }
    });

    if (!user) {
      res.status(401).json(
        errorResponse('User not found.')
      );
      return;
    }

    // User Story 3: Check if user has Admin role
    if (user.role !== 'Admin') {
      res.status(403).json(
        errorResponse('Access denied. Admin role required.')
      );
      return;
    }

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(
      errorResponse('Authorization check failed.', [errorMessage])
    );
  }
};



