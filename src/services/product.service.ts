/**
 * Product service - Business logic for product operations
 */
import { PrismaClient, Product, User, Prisma } from '@prisma/client';
import {
  getCache,
  setCache,
  deleteCacheByPattern,
  generateProductListCacheKey,
} from '../utils/redis.util.js';

const prisma = new PrismaClient();
const CACHE_TTL = 3600; // 1 hour cache TTL

export interface CreateProductData {
  name: string;
  description: string;
  price: number | string;
  stock: number | string;
  category: string;
  userId: string;
  imageUrl?: string; // Cloudinary image URL
}

export interface ProductOptions {
  page?: number | string;
  pageSize?: number | string;
  limit?: number | string; // User Story 5: Support both limit and pageSize
  category?: string;
  userId?: string;
  search?: string;
  minPrice?: number | string; // Advanced search: minimum price filter
  maxPrice?: number | string; // Advanced search: maximum price filter
  sortBy?: string; // Advanced search: sort field (price, name, createdAt)
  sortOrder?: 'asc' | 'desc'; // Advanced search: sort order
}

export interface ProductListResult {
  products: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    description?: string;
    imageUrl?: string | null; // Cloudinary image URL
  }>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalProducts: number;
}

export interface ProductWithUser extends Product {
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface PaginatedProductsResult {
  products: ProductWithUser[];
  pageNumber: number;
  pageSize: number;
  totalSize: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
  category?: string;
  imageUrl?: string; // Cloudinary image URL
}

/**
 * Create a new product
 */
export const createProduct = async (productData: CreateProductData): Promise<ProductWithUser> => {
  const { name, description, price, stock, category, userId, imageUrl } = productData;

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price.toString()),
      stock: parseInt(stock.toString()),
      category,
      userId,
      imageUrl: imageUrl || null,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  // Invalidate product list cache
  try {
    await deleteCacheByPattern('products:*');
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }

  return product as ProductWithUser;
};

/**
 * Get all products with pagination
 * Legacy method - returns full product details with user info
 */
export const getProducts = async (
  options: ProductOptions = {}
): Promise<PaginatedProductsResult> => {
  const { page = 1, pageSize = 10, category, userId, search } = options;

  const skip = (parseInt(page.toString()) - 1) * parseInt(pageSize.toString());
  const take = parseInt(pageSize.toString());

  // Build where clause
  const where: any = {};
  if (category) where.category = category;
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get products and total count
  const [products, totalSize] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products as ProductWithUser[],
    pageNumber: parseInt(page.toString()),
    pageSize: take,
    totalSize,
  };
};

/**
 * Get product list (User Story 5) with search functionality (User Story 6)
 * Returns only essential product information for public listing
 *
 * User Story 6:
 * - Search parameter searches product name only (case-insensitive, partial-match)
 * - If search is empty or not provided, returns all products
 * - totalProducts reflects the count of search results, not all products
 *
 * Enhanced with:
 * - Redis caching for improved performance
 * - Advanced search and filtering (price range, sorting)
 */
export const getProductList = async (options: ProductOptions = {}): Promise<ProductListResult> => {
  const {
    page = 1,
    pageSize,
    limit,
    category,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Generate cache key
  const cacheKey = generateProductListCacheKey(options);

  // Try to get from cache
  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.error('Cache read error:', error);
    // Continue with database query if cache fails
  }

  // User Story 5: Support both limit and pageSize, default to 10
  const itemsPerPage = limit
    ? parseInt(limit.toString())
    : pageSize
      ? parseInt(pageSize.toString())
      : 10;
  const currentPage = parseInt(page.toString());
  const skip = (currentPage - 1) * itemsPerPage;
  const take = itemsPerPage;

  // Build where clause (User Story 5: public endpoint, no userId filter)
  const where: Prisma.ProductWhereInput = {};

  if (category) where.category = category;

  // User Story 6: Search by product name only (case-insensitive, partial-match)
  // If search is empty, null, or not provided, return all products
  if (search && typeof search === 'string' && search.trim() !== '') {
    where.name = { contains: search.trim(), mode: 'insensitive' };
  }

  // Advanced search: Price range filtering
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = parseFloat(minPrice.toString());
    }
    if (maxPrice !== undefined) {
      where.price.lte = parseFloat(maxPrice.toString());
    }
  }

  // Advanced search: Sorting
  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  if (sortBy === 'price') {
    orderBy.price = sortOrder;
  } else if (sortBy === 'name') {
    orderBy.name = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  // Get products and total count
  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      select: {
        // User Story 5: Essential product information only
        id: true,
        name: true,
        price: true,
        stock: true,
        category: true,
        description: true,
        imageUrl: true, // Include image URL
      },
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const result: ProductListResult = {
    products,
    currentPage,
    pageSize: itemsPerPage,
    totalPages,
    totalProducts,
  };

  // Cache the result
  try {
    await setCache(cacheKey, JSON.stringify(result), CACHE_TTL);
  } catch (error) {
    console.error('Cache write error:', error);
    // Continue even if cache write fails
  }

  return result;
};

/**
 * Get product by ID (User Story 7)
 * Returns complete product object with all details
 */
export const getProductById = async (
  productId: string
): Promise<{
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      // User Story 7: Complete product object with all details
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      category: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!product) {
    const error = new Error('Product not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/**
 * Update product
 * User Story 4: Admin can update any product (no userId check needed)
 */
export const updateProduct = async (
  productId: string,
  updateData: UpdateProductData,
  isAdmin: boolean = false,
  userId?: string
): Promise<ProductWithUser> => {
  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    const error = new Error('Product not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  // User Story 4: Only Admin can update products (or owner for legacy endpoint)
  if (!isAdmin) {
    if (!userId || existingProduct.userId !== userId) {
      const error = new Error('You are not authorized to update this product') as Error & {
        statusCode?: number;
      };
      error.statusCode = 403;
      throw error;
    }
  }

  // Prepare update data
  const data: any = {};
  if (updateData.name) data.name = updateData.name;
  if (updateData.description) data.description = updateData.description;
  if (updateData.price !== undefined) data.price = parseFloat(updateData.price.toString());
  if (updateData.stock !== undefined) data.stock = parseInt(updateData.stock.toString());
  if (updateData.category) data.category = updateData.category;
  if (updateData.imageUrl !== undefined) data.imageUrl = updateData.imageUrl;

  const product = await prisma.product.update({
    where: { id: productId },
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  // Invalidate product list cache
  try {
    await deleteCacheByPattern('products:*');
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }

  return product as ProductWithUser;
};

/**
 * Delete product (User Story 8)
 * Admin can delete any product
 */
export const deleteProduct = async (
  productId: string,
  isAdmin: boolean = false,
  userId?: string
): Promise<void> => {
  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    const error = new Error('Product not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  // User Story 8: Only Admin can delete products (or owner for legacy endpoint)
  if (!isAdmin) {
    if (!userId || existingProduct.userId !== userId) {
      const error = new Error('You are not authorized to delete this product') as Error & {
        statusCode?: number;
      };
      error.statusCode = 403;
      throw error;
    }
  }

  await prisma.product.delete({
    where: { id: productId },
  });

  // Invalidate product list cache
  try {
    await deleteCacheByPattern('products:*');
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};
