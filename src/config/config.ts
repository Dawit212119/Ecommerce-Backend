import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  jwtSecret: string;
  jwtExpiresIn: string;
  redisUrl?: string;
  cookie: {
    name: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  };
  cloudinary: {
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
    folder?: string;
  };
}

function getRequired(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development';

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv,
  jwtSecret: getRequired('JWT_SECRET', process.env.JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  redisUrl: process.env.REDIS_URL,
  cookie: {
    name: process.env.COOKIE_NAME ?? 'authToken',
    httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
    secure: process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production',
    sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') ?? 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER ?? 'uploads',
  },
};

export const isProd = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';
export const isDev = !isProd && !isTest;
