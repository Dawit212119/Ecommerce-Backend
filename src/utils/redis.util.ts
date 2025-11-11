/**
 * Redis Client Utility for Caching
 */
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client - supports cloud Redis (e.g., Redis Cloud, AWS ElastiCache)
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: times => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('error', err => {
  console.error('❌ Redis client error:', err);
});

redisClient.on('close', () => {
  console.log('🔌 Redis client connection closed');
});

/**
 * Get cached data
 */
export const getCache = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};

/**
 * Set cache with expiration (in seconds)
 */
export const setCache = async (
  key: string,
  value: string,
  expiration: number = 3600
): Promise<void> => {
  try {
    await redisClient.setex(key, expiration, value);
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

/**
 * Delete cache by key
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Error deleting cache:', error);
  }
};

/**
 * Delete cache by pattern (e.g., 'products:*')
 */
export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error('Error deleting cache by pattern:', error);
  }
};

/**
 * Generate cache key for product list
 */
export const generateProductListCacheKey = (options: {
  page?: number | string;
  pageSize?: number | string;
  limit?: number | string;
  category?: string;
  search?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sortBy?: string;
  sortOrder?: string;
}): string => {
  const {
    page = 1,
    pageSize,
    limit,
    category,
    search,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  } = options;

  const itemsPerPage = limit || pageSize || 10;
  const parts = [
    'products',
    `page:${page}`,
    `limit:${itemsPerPage}`,
    category ? `category:${category}` : '',
    search ? `search:${search}` : '',
    minPrice ? `minPrice:${minPrice}` : '',
    maxPrice ? `maxPrice:${maxPrice}` : '',
    sortBy ? `sortBy:${sortBy}` : '',
    sortOrder ? `sortOrder:${sortOrder}` : '',
  ].filter(Boolean);

  return parts.join(':');
};

export default redisClient;
