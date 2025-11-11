/**
 * Order routes - Define all order-related endpoints
 */
import express, { Router } from 'express';
import { body, query } from 'express-validator';
import * as orderController from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { orderLimiter } from '../middleware/rateLimit.middleware.js';

const router: Router = express.Router();

/**
 * @route   POST /orders
 * @desc    Place a new order (User Story 9)
 * @access  Private (Authenticated users only)
 *
 * User Story 9:
 * - Request body: array of products with productId and quantity
 * - Example: [{ "productId": "uuid", "quantity": 2 }, { "productId": "uuid", "quantity": 1 }]
 * - Returns 201 Created with order details on success
 * - Returns 400 Bad Request for insufficient stock
 * - Returns 404 Not Found for invalid productId
 */
router.post(
  '/',
  orderLimiter,
  authenticate,
  [
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('products').isArray({ min: 1 }).withMessage('Order must contain at least one product'),
    body('products.*.productId').notEmpty().withMessage('Product ID is required for each product'),
    body('products.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer for each product'),
  ],
  validate,
  orderController.createOrder
);

/**
 * @route   POST /api/orders
 * @desc    Create a new order (legacy endpoint)
 * @access  Private
 */
router.post(
  '/api/orders',
  authenticate,
  [
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('products').isArray({ min: 1 }).withMessage('Order must contain at least one product'),
    body('products.*.productId').notEmpty().withMessage('Product ID is required for each product'),
    body('products.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer for each product'),
  ],
  validate,
  orderController.createOrder
);

/**
 * @route   GET /orders
 * @desc    View my order history (User Story 10)
 * @access  Private (Authenticated users only)
 *
 * User Story 10:
 * - Returns array of user's orders
 * - Each order contains: order_id, status, total_price, created_at
 * - Returns empty array if user has no orders
 * - Returns 401 Unauthorized for unauthenticated users
 */
router.get('/', authenticate, orderController.getOrderHistory);

/**
 * @route   GET /api/orders
 * @desc    Get all orders with pagination (legacy endpoint)
 * @access  Private
 */
router.get(
  '/api/orders',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Page size must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid status value'),
  ],
  validate,
  orderController.getOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', authenticate, orderController.getOrderById);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private
 */
router.put(
  '/:id/status',
  authenticate,
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage(
        'Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled'
      ),
  ],
  validate,
  orderController.updateOrderStatus
);

export default router;
