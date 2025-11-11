/**
 * Order controller - Handles HTTP requests for order operations
 */
import { Response, NextFunction } from 'express';
import * as orderService from '../services/order.service.js';
import { successResponse, createPaginatedResponse } from '../utils/response.util.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Create a new order (User Story 9)
 * User Story 9: Place a new order for authenticated users
 *
 * - Uses userId from authenticated JWT
 * - Returns 201 Created with order details on success
 * - Returns 400 Bad Request for insufficient stock
 * - Returns 404 Not Found for invalid productId
 */
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // User Story 9: Use userId from authenticated JWT
    const orderData = {
      ...req.body,
      userId: req.user.userId,
    };

    // User Story 9: Create order with transaction support
    const order = await orderService.createOrder(orderData);

    // User Story 9: Return 201 Created with order details
    // Response includes: order_id, status, total_price, and list of products
    const orderObj = order as any;
    const orderResponse = {
      id: orderObj.id,
      userId: orderObj.userId,
      description: orderObj.description,
      status: orderObj.status,
      totalPrice: orderObj.totalPrice,
      createdAt: orderObj.createdAt,
      products: order.orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: item.product,
      })),
    };

    res.status(201).json(orderResponse);
  } catch (error) {
    // User Story 9: Error handling (400 for insufficient stock, 404 for product not found)
    next(error);
  }
};

/**
 * Get order history (User Story 10)
 * Returns array of order summaries for the authenticated user
 *
 * User Story 10:
 * - GET /orders endpoint
 * - Protected (authenticated users only)
 * - Filters by userId from JWT (users can only see their own orders)
 * - Returns 200 OK with array of order objects
 * - Returns empty array if user has no orders
 * - Returns 401 Unauthorized for unauthenticated users
 */
export const getOrderHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User Story 10: Check authentication
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // User Story 10: Get orders filtered by userId from JWT
    const orders = await orderService.getUserOrderHistory(req.user.userId);

    // User Story 10: Return 200 OK with array of orders (empty array if none)
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders with pagination (legacy endpoint)
 */
export const getOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { page, pageSize, status } = req.query;
    const result = await orderService.getOrders({
      page: page as string | undefined,
      pageSize: pageSize as string | undefined,
      userId: req.user.userId, // Users can only see their own orders
      status: status as string | undefined,
    });

    res
      .status(200)
      .json(
        createPaginatedResponse(
          true,
          'Orders retrieved successfully',
          result.orders,
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
 * Get order by ID
 */
export const getOrderById = async (
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
    const order = await orderService.getOrderById(id, req.user.userId);
    res.status(200).json(successResponse('Order retrieved successfully', order));
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
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
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(id, req.user.userId, status);
    res.status(200).json(successResponse('Order status updated successfully', order));
  } catch (error) {
    next(error);
  }
};
