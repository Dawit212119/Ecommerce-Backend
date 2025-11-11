// Global error handling middleware
 
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util.js';

interface CustomError extends Error {
  code?: string;
  statusCode?: number;
}


export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    res.status(409).json(
      errorResponse('Duplicate entry. This record already exists.')
    );
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json(
      errorResponse('Record not found.')
    );
    return;
  }

  // Handle product not found errors
  if (err.message === 'Product not found' && (err as any).statusCode === 404) {
    res.status(404).json(
      errorResponse('Product not found.')
    );
    return;
  }

//Handle product not found in order (404)
  if (err.message.includes('Product with ID') && err.message.includes('not found') && (err as any).statusCode === 404) {
    res.status(404).json(
      errorResponse(err.message)
    );
    return;
  }

  // Handle insufficient stock errors (400)
  if (err.message.includes('Insufficient stock') && (err as any).statusCode === 400) {
    res.status(400).json(
      errorResponse(err.message)
    );
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values((err as any).errors).map((e: any) => e.message);
    res.status(400).json(
      errorResponse('Validation failed.', errors)
    );
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json(
      errorResponse('Invalid token.')
    );
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json(
      errorResponse('Token has expired.')
    );
    return;
  }

  // Handle login authentication errors
  if (err.message === 'Invalid credentials' && (err as any).statusCode === 401) {
    res.status(401).json(
      errorResponse('Invalid credentials')
    );
    return;
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = process.env.NODE_ENV === 'development' ? [err.stack || ''] : null;

  res.status(statusCode).json(
    errorResponse(message, errors)
  );
};

// 404 Not Found handler
 
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    errorResponse(`Route ${req.method} ${req.path} not found.`)
  );
};


