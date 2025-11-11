// Validation middleware using express-validator

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.util.js';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      const field = err.type === 'field' ? err.path : 'field';
      return `${field}: ${err.msg}`;
    });
    res
      .status(400)
      .json(errorResponse('Validation failed. Please check the following fields:', errorMessages));
    return;
  }

  next();
};
