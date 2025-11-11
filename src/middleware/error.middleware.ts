// Global error handling middleware

import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util.js';
import { AppError } from '../errors/AppError.js';
import { config } from '../config/config.js';

interface PrismaLikeError extends Error {
  code?: string;
  statusCode?: number;
}

const isPrismaError = (e: unknown): e is PrismaLikeError => {
  return typeof (e as any)?.code === 'string';
};

export const errorHandler = (
  err: PrismaLikeError | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // eslint-disable-next-line no-console
  console.error('Error:', err);

  // Prisma errors
  if (isPrismaError(err) && err.code === 'P2002') {
    res.status(409).json(errorResponse('Duplicate entry. This record already exists.'));
    return;
  }

  if (isPrismaError(err) && err.code === 'P2025') {
    res.status(404).json(errorResponse('Record not found.'));
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json(errorResponse('Invalid token.'));
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json(errorResponse('Token has expired.'));
    return;
  }

  // AppError path or fallback
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = config.nodeEnv === 'development' ? [err.stack || ''] : null;

  res.status(statusCode).json(errorResponse(message, errors));
};

// 404 Not Found handler

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(errorResponse(`Route ${req.method} ${req.path} not found.`));
};
