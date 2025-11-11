/**
 * Product controller - Handles HTTP requests for product operations
 */
import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service.js';
import { successResponse, createPaginatedResponse } from '../utils/response.util.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { uploadImage, deleteImage, extractPublicIdFromUrl } from '../utils/cloudinary.util.js';

/**
 * Create a new product
 * User Story 3: Admin-only endpoint, returns 201 Created on success, 400 on validation errors
 */
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let imageUrl: string | undefined;

    // Handle image upload if file is present
    if (req.file) {
      try {
        const uploadResult = await uploadImage(req.file.buffer, 'ecommerce-products');
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        res.status(400).json({
          success: false,
          message: 'Failed to upload image',
          errors: [(uploadError as Error).message],
        });
        return;
      }
    }

    const productData = {
      ...req.body,
      userId: req.user.userId, // User Story 3: Admin's userId is used
      imageUrl, // Cloudinary image URL
    };
    const product = await productService.createProduct(productData);
    // User Story 3: Return 201 Created with newly created product data
    res.status(201).json(successResponse('Product created successfully', product));
  } catch (error) {
    // User Story 3: Validation errors return 400 Bad Request (handled by validation middleware)
    next(error);
  }
};

/**
 * Get product list (User Story 5) with search functionality (User Story 6)
 * Public endpoint - returns paginated list with essential product information
 *
 * User Story 6:
 * - Accepts ?search=productName query parameter
 * - If search is empty or not provided, returns all products
 * - If search is provided, performs case-insensitive, partial-match search against product name only
 * - Response format: currentPage, pageSize, totalPages, totalProducts (reflecting search results), products
 */
export const getProductList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, pageSize, category, search, minPrice, maxPrice, sortBy, sortOrder } =
      req.query;

    // User Story 6: Handle empty string search (treat as no search)
    const searchQuery =
      search && (search as string).trim() !== '' ? (search as string).trim() : undefined;

    const result = await productService.getProductList({
      page: page as string | undefined,
      limit: limit as string | undefined,
      pageSize: pageSize as string | undefined,
      category: category as string | undefined,
      search: searchQuery,
      minPrice: minPrice as string | undefined,
      maxPrice: maxPrice as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });

    // User Story 5 & 6: Return paginated format with currentPage, pageSize, totalPages,
    // totalProducts (reflecting search results count), products
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products with pagination (legacy endpoint with full details)
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, pageSize, category, userId, search } = req.query;
    const result = await productService.getProducts({
      page: page as string | undefined,
      pageSize: pageSize as string | undefined,
      category: category as string | undefined,
      userId: userId as string | undefined,
      search: search as string | undefined,
    });

    res
      .status(200)
      .json(
        createPaginatedResponse(
          true,
          'Products retrieved successfully',
          result.products,
          result.pageNumber,
          result.pageSize,
          result.totalSize,
          null
        )
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID (User Story 7)
 * Public endpoint - returns complete product details
 *
 * User Story 7:
 * - GET /products/:id endpoint
 * - Public (no authentication required)
 * - Returns 200 OK with complete product object if found
 * - Returns 404 Not Found with "Product not found" message if not found
 */
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    // User Story 7: Return 200 OK with complete product object directly
    res.status(200).json(product);
  } catch (error) {
    // User Story 7: 404 Not Found handled by error middleware
    next(error);
  }
};

/**
 * Update product (Admin only - User Story 4)
 */
export const updateProductAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;

    // Get existing product to handle image deletion if new image is uploaded
    const existingProduct = await productService.getProductById(id).catch(() => null);
    let imageUrl: string | undefined = req.body.imageUrl;

    // Handle image upload if file is present
    if (req.file) {
      try {
        // Delete old image from Cloudinary if it exists
        if (existingProduct && existingProduct.imageUrl) {
          const oldPublicId = extractPublicIdFromUrl(existingProduct.imageUrl);
          if (oldPublicId) {
            try {
              await deleteImage(oldPublicId);
            } catch (deleteError) {
              console.error('Error deleting old image:', deleteError);
              // Continue even if deletion fails
            }
          }
        }

        const uploadResult = await uploadImage(req.file.buffer, 'ecommerce-products');
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        res.status(400).json({
          success: false,
          message: 'Failed to upload image',
          errors: [(uploadError as Error).message],
        });
        return;
      }
    }

    // User Story 4: Admin can update any product
    const updateData = {
      ...req.body,
      ...(imageUrl !== undefined && { imageUrl }),
    };

    const product = await productService.updateProduct(
      id,
      updateData,
      true, // isAdmin = true
      req.user.userId
    );
    // User Story 4: Return 200 OK with updated product data
    res.status(200).json(successResponse('Product updated successfully', product));
  } catch (error) {
    // User Story 4: 404 for product not found, 400 for validation errors
    next(error);
  }
};

/**
 * Update product (legacy endpoint - owner only)
 */
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const product = await productService.updateProduct(
      id,
      req.body,
      false, // isAdmin = false
      req.user.userId
    );
    res.status(200).json(successResponse('Product updated successfully', product));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product (Admin only - User Story 8)
 */
export const deleteProductAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    // User Story 8: Admin can delete any product
    await productService.deleteProduct(id, true, req.user.userId);

    // User Story 8: Return 200 OK with confirmation message
    res.status(200).json(successResponse('Product deleted successfully', null));
  } catch (error) {
    // User Story 8: 404 Not Found handled by error middleware
    next(error);
  }
};

/**
 * Delete product (legacy endpoint - owner only)
 */
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    await productService.deleteProduct(id, false, req.user.userId);
    res.status(200).json(successResponse('Product deleted successfully', null));
  } catch (error) {
    next(error);
  }
};
