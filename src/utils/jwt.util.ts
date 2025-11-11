// JWT utility functions for token generation and verification

import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { config } from '../config/config.js';

/**
 * Claims stored in issued JWTs.
 */
export interface JwtPayload {
  userId: string;
  username: string;
  email?: string;
}

/**
 * Issue a signed JWT for the given principal.
 */
export const generateToken = (userId: string, username: string, email?: string): string => {
  const payload: JwtPayload = {
    userId,
    username,
    ...(email && { email }),
  };

  const secretKey: Secret = config.jwtSecret;
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as StringValue,
  };

  return jwt.sign(payload, secretKey, options);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch (error) {
    return null;
  }
};
