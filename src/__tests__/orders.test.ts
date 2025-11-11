/**
 * Order Endpoints Tests
 */
import request from 'supertest';
import express, { Application } from 'express';
import orderRoutes from '../routes/order.routes.js';
import { errorHandler } from '../middleware/error.middleware.js';
import * as orderService from '../services/order.service.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Mock services and middleware
jest.mock('../services/order.service.js');
jest.mock('../middleware/auth.middleware.js');

const app: Application = express();
app.use(express.json());
app.use('/orders', orderRoutes);
app.use(errorHandler);

// Mock authenticate middleware
(authenticate as jest.Mock) = jest.fn((req: any, res: any, next: any) => {
  req.user = {
    userId: 'user-id-123',
    username: 'testuser',
    email: 'test@example.com',
  };
  next();
});

describe('POST /orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an order successfully', async () => {
    const orderData = {
      products: [
        { productId: 'product-id-1', quantity: 2 },
        { productId: 'product-id-2', quantity: 1 },
      ],
    };

    const mockOrder = {
      id: 'order-id-123',
      userId: 'user-id-123',
      status: 'pending',
      totalPrice: 299.98,
      createdAt: new Date(),
      user: {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
      },
      orderItems: [
        {
          productId: 'product-id-1',
          quantity: 2,
          price: 199.98,
          product: {
            id: 'product-id-1',
            name: 'Product 1',
            description: 'Description 1',
            price: 99.99,
            category: 'Electronics',
          },
        },
        {
          productId: 'product-id-2',
          quantity: 1,
          price: 100.0,
          product: {
            id: 'product-id-2',
            name: 'Product 2',
            description: 'Description 2',
            price: 100.0,
            category: 'Clothing',
          },
        },
      ],
    };

    (orderService.createOrder as jest.Mock).mockResolvedValue(mockOrder);

    const response = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer mock-token')
      .send(orderData)
      .expect(201);

    expect(response.body.id).toBe(mockOrder.id);
    expect(response.body.status).toBe('pending');
    expect(response.body.totalPrice).toBe(299.98);
    expect(response.body.products).toHaveLength(2);
  });

  it('should return 400 for insufficient stock', async () => {
    const orderData = {
      products: [{ productId: 'product-id-1', quantity: 1000 }],
    };

    const error = new Error(
      'Insufficient stock for product Product 1. Available: 10, Requested: 1000'
    ) as Error & { statusCode?: number };
    error.statusCode = 400;

    (orderService.createOrder as jest.Mock).mockRejectedValue(error);

    const response = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer mock-token')
      .send(orderData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Insufficient stock');
  });

  it('should return 404 for invalid product ID', async () => {
    const orderData = {
      products: [{ productId: 'non-existent-id', quantity: 1 }],
    };

    const error = new Error('Product with ID non-existent-id not found') as Error & {
      statusCode?: number;
    };
    error.statusCode = 404;

    (orderService.createOrder as jest.Mock).mockRejectedValue(error);

    const response = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer mock-token')
      .send(orderData)
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  it('should return 400 for invalid request body', async () => {
    const invalidData = {
      products: [], // Empty array
    };

    const response = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer mock-token')
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

describe('GET /orders', () => {
  it('should get user order history', async () => {
    const mockOrders = [
      {
        order_id: 'order-id-1',
        status: 'pending',
        total_price: 199.99,
        created_at: new Date('2024-01-15'),
      },
      {
        order_id: 'order-id-2',
        status: 'delivered',
        total_price: 299.99,
        created_at: new Date('2024-01-10'),
      },
    ];

    (orderService.getUserOrderHistory as jest.Mock).mockResolvedValue(mockOrders);

    const response = await request(app)
      .get('/orders')
      .set('Authorization', 'Bearer mock-token')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('order_id');
    expect(response.body[0]).toHaveProperty('status');
    expect(response.body[0]).toHaveProperty('total_price');
    expect(response.body[0]).toHaveProperty('created_at');
  });

  it('should return empty array when user has no orders', async () => {
    (orderService.getUserOrderHistory as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .get('/orders')
      .set('Authorization', 'Bearer mock-token')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });
});
