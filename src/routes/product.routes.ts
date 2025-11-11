/**
 * Product routes - Define all product-related endpoints
 */
import express, { Router } from 'express';
import { body, query } from 'express-validator';
import * as productController from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { apiLimiter, productCreationLimiter } from '../middleware/rateLimit.middleware.js';

const router: Router = express.Router();

/**
 * @route   POST /products
 * @desc    Create a new product (User Story 3)
 * @access  Private (Admin only)
 */
router.post(
  '/',
  apiLimiter,
  productCreationLimiter,
  authenticate,
  requireAdmin,
  uploadSingle,
  [
    // User Story 3: name validation - 3 to 100 characters
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Product name must be between 3 and 100 characters'),

    // User Story 3: description validation - at least 10 characters
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Product description is required')
      .isLength({ min: 10 })
      .withMessage('Product description must be at least 10 characters long'),

    // User Story 3: price validation - positive number greater than 0
    body('price')
      .isFloat({ min: 0.01 })
      .withMessage('Price must be a positive number greater than 0'),

    // User Story 3: stock validation - non-negative integer (0 or more)
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer (0 or more)'),

    // User Story 3: category validation - required
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  validate,
  productController.createProduct
);

/**
 * @route   GET /products
 * @desc    Get list of products (User Story 5) with search functionality (User Story 6) - Public endpoint
 * @access  Public
 *
 * Query Parameters:
 * - page: Page number (defaults to 1)
 * - limit or pageSize: Items per page (defaults to 10)
 * - search: Search by product name (case-insensitive, partial-match). If empty or not provided, returns all products.
 * - category: Filter by category (optional)
 */
router.get(
  '/',
  [
    // User Story 5: page parameter - defaults to 1
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    // User Story 5: Support both limit and pageSize
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Page size must be between 1 and 100'),

    query('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must not exceed 100 characters'),

    // User Story 6: search parameter - searches product name (case-insensitive, partial-match)
    // Can be empty string or not provided - returns all products in that case
    query('search')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Search term must not exceed 200 characters'),

    // Advanced search: Price range filtering
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a non-negative number'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a non-negative number'),

    // Advanced search: Sorting
    query('sortBy')
      .optional()
      .isIn(['price', 'name', 'createdAt'])
      .withMessage('Sort by must be one of: price, name, createdAt'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc'),
  ],
  validate,
  productController.getProductList
);

/**
 * @route   GET /products/:id
 * @desc    Get product details by ID (User Story 7)
 * @access  Public
 *
 * User Story 7:
 * - Returns complete product object with all details (id, name, description, price, stock, category)
 * - Returns 200 OK if product found
 * - Returns 404 Not Found with "Product not found" message if product doesn't exist
 */
router.get('/:id', productController.getProductById);

/**
 * @route   PUT /products/:id
 * @desc    Update product (User Story 4) - Admin only
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  apiLimiter,
  authenticate,
  requireAdmin,
  uploadSingle,
  [
    // User Story 4: name validation - same as creation (3 to 100 characters)
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Product name cannot be empty')
      .isLength({ min: 3, max: 100 })
      .withMessage('Product name must be between 3 and 100 characters'),

    // User Story 4: description validation - same as creation (at least 10 characters)
    body('description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Product description cannot be empty')
      .isLength({ min: 10 })
      .withMessage('Product description must be at least 10 characters long'),

    // User Story 4: price validation - same as creation (positive number > 0)
    body('price')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Price must be a positive number greater than 0'),

    // User Story 4: stock validation - same as creation (non-negative integer)
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer (0 or more)'),

    // User Story 4: category validation - non-empty if provided
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  ],
  validate,
  productController.updateProductAdmin
);

/**
 * @route   DELETE /products/:id
 * @desc    Delete product (User Story 8) - Admin only
 * @access  Private (Admin only)
 *
 * User Story 8:
 * - DELETE /products/:id endpoint
 * - Admin-only access (403/401 for non-admin/unauthenticated)
 * - Returns 200 OK with "Product deleted successfully" message on success
 * - Returns 404 Not Found if product doesn't exist
 */
router.delete('/:id', authenticate, requireAdmin, productController.deleteProductAdmin);

export default router;
