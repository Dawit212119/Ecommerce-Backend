/**
 * Product Endpoints Tests
 */
import request from 'supertest';
import express, { Application } from 'express';
import productRoutes from '../routes/product.routes.js';
import { errorHandler } from '../middleware/error.middleware.js';
import * as productService from '../services/product.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

// Mock services and middleware
jest.mock('../services/product.service.js');
jest.mock('../middleware/auth.middleware.js');
jest.mock('../middleware/admin.middleware.js');

const app: Application = express();
app.use(express.json());
app.use('/products', productRoutes);
app.use(errorHandler);

// Mock authenticate middleware
(authenticate as jest.Mock) = jest.fn((req: any, res: any, next: any) => {
  req.user = {
    userId: 'admin-user-id',
    username: 'admin',
    email: 'admin@example.com',
  };
  next();
});

// Mock requireAdmin middleware
(requireAdmin as jest.Mock) = jest.fn((req: any, res: any, next: any) => {
  next();
});

describe('GET /products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get paginated list of products', async () => {
    const mockResult = {
      products: [
        { id: '1', name: 'Product 1', price: 100, stock: 10, category: 'Electronics' },
        { id: '2', name: 'Product 2', price: 200, stock: 5, category: 'Clothing' },
      ],
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      totalProducts: 2,
    };

    (productService.getProductList as jest.Mock).mockResolvedValue(mockResult);

    const response = await request(app).get('/products').expect(200);

    expect(response.body).toMatchObject(mockResult);
    expect(response.body.products).toHaveLength(2);
  });

  it('should search products by name', async () => {
    const mockResult = {
      products: [{ id: '1', name: 'Laptop', price: 1000, stock: 5, category: 'Electronics' }],
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      totalProducts: 1,
    };

    (productService.getProductList as jest.Mock).mockResolvedValue(mockResult);

    const response = await request(app).get('/products?search=Laptop').expect(200);

    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  it('should filter products by category', async () => {
    const mockResult = {
      products: [{ id: '1', name: 'Product 1', price: 100, stock: 10, category: 'Electronics' }],
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      totalProducts: 1,
    };

    (productService.getProductList as jest.Mock).mockResolvedValue(mockResult);

    const response = await request(app).get('/products?category=Electronics').expect(200);

    expect(response.body.products).toHaveLength(1);
  });
});

describe('GET /products/:id', () => {
  it('should get product by ID', async () => {
    const mockProduct = {
      id: 'product-id-123',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stock: 50,
      category: 'Electronics',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (productService.getProductById as jest.Mock).mockResolvedValue(mockProduct);

    const response = await request(app).get('/products/product-id-123').expect(200);

    expect(response.body).toMatchObject({
      id: mockProduct.id,
      name: mockProduct.name,
      price: mockProduct.price,
    });
  });

  it('should return 404 for non-existent product', async () => {
    const error = new Error('Product not found') as Error & { statusCode?: number };
    error.statusCode = 404;

    (productService.getProductById as jest.Mock).mockRejectedValue(error);

    const response = await request(app).get('/products/non-existent-id').expect(404);

    expect(response.body.success).toBe(false);
  });
});

describe('POST /products', () => {
  it('should create a product as admin', async () => {
    const productData = {
      name: 'New Product',
      description: 'This is a new product description',
      price: 199.99,
      stock: 100,
      category: 'Electronics',
    };

    const mockProduct = {
      id: 'new-product-id',
      ...productData,
      userId: 'admin-user-id',
      user: {
        id: 'admin-user-id',
        username: 'admin',
        email: 'admin@example.com',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (productService.createProduct as jest.Mock).mockResolvedValue(mockProduct);

    const response = await request(app)
      .post('/products')
      .set('Authorization', 'Bearer mock-token')
      .send(productData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.object.name).toBe(productData.name);
  });

  it('should return 400 for invalid product data', async () => {
    const invalidData = {
      name: 'AB', // Too short
      description: 'Short', // Too short
      price: -10, // Negative
      stock: -5, // Negative
    };

    const response = await request(app)
      .post('/products')
      .set('Authorization', 'Bearer mock-token')
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

describe('PUT /products/:id', () => {
  it('should update a product as admin', async () => {
    const updateData = {
      name: 'Updated Product Name',
      price: 299.99,
    };

    const mockProduct = {
      id: 'product-id-123',
      name: 'Updated Product Name',
      description: 'Original description',
      price: 299.99,
      stock: 50,
      category: 'Electronics',
      user: {
        id: 'admin-user-id',
        username: 'admin',
        email: 'admin@example.com',
      },
    };

    (productService.updateProduct as jest.Mock).mockResolvedValue(mockProduct);

    const response = await request(app)
      .put('/products/product-id-123')
      .set('Authorization', 'Bearer mock-token')
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.object.name).toBe(updateData.name);
  });

  it('should return 404 for non-existent product', async () => {
    const error = new Error('Product not found') as Error & { statusCode?: number };
    error.statusCode = 404;

    (productService.updateProduct as jest.Mock).mockRejectedValue(error);

    const response = await request(app)
      .put('/products/non-existent-id')
      .set('Authorization', 'Bearer mock-token')
      .send({ name: 'Updated Name' })
      .expect(404);

    expect(response.body.success).toBe(false);
  });
});

describe('DELETE /products/:id', () => {
  it('should delete a product as admin', async () => {
    (productService.deleteProduct as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete('/products/product-id-123')
      .set('Authorization', 'Bearer mock-token')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Product deleted successfully');
  });

  it('should return 404 for non-existent product', async () => {
    const error = new Error('Product not found') as Error & { statusCode?: number };
    error.statusCode = 404;

    (productService.deleteProduct as jest.Mock).mockRejectedValue(error);

    const response = await request(app)
      .delete('/products/non-existent-id')
      .set('Authorization', 'Bearer mock-token')
      .expect(404);

    expect(response.body.success).toBe(false);
  });
});
