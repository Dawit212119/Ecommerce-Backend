 //JWT utility functions for token generation and verification

import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

export interface JwtPayload {
  userId: string;
  username: string;
  email?: string; 
}


export const generateToken = (userId: string, username: string, email?: string): string => {
  const payload: JwtPayload = {
    userId,
    username,
    ...(email && { email })
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const secretKey: Secret = secret;
  const options: SignOptions = {
    expiresIn: ((process.env.JWT_EXPIRES_IN ?? '7d') as StringValue)
  };

  return jwt.sign(payload, secretKey, options);
};


export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    return null;
  }
};


