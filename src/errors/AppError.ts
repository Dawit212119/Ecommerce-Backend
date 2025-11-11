export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  metadata?: Record<string, unknown>;

  constructor(message: string, statusCode = 500, metadata?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.metadata = metadata;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export const badRequest = (message: string, metadata?: Record<string, unknown>) =>
  new AppError(message, 400, metadata);

export const unauthorized = (message: string, metadata?: Record<string, unknown>) =>
  new AppError(message, 401, metadata);

export const forbidden = (message: string, metadata?: Record<string, unknown>) =>
  new AppError(message, 403, metadata);

export const notFound = (message: string, metadata?: Record<string, unknown>) =>
  new AppError(message, 404, metadata);

export const conflict = (message: string, metadata?: Record<string, unknown>) =>
  new AppError(message, 409, metadata);
