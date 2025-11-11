import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  jwtSecret: string;
  jwtExpiresIn: string;
  redisUrl?: string;
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

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
  jwtSecret: getRequired('JWT_SECRET', process.env.JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  redisUrl: process.env.REDIS_URL,
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
