/**
 * Swagger/OpenAPI configuration
 */
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config.js';
// Import swagger documentation
import '../docs/swagger.js';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description:
        'Comprehensive REST API for e-commerce platform with Express, Prisma, and JWT authentication',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            object: {
              type: 'object',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              example: 'USER',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Product Name',
            },
            description: {
              type: 'string',
              example: 'Product description',
            },
            price: {
              type: 'number',
              format: 'float',
              example: 99.99,
            },
            stock: {
              type: 'integer',
              example: 100,
            },
            category: {
              type: 'string',
              example: 'Electronics',
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              example: 'https://example.com/image.jpg',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Order description',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
              example: 'pending',
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              example: 199.98,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'string',
                    format: 'uuid',
                  },
                  quantity: {
                    type: 'integer',
                  },
                  price: {
                    type: 'number',
                    format: 'float',
                  },
                  product: {
                    $ref: '#/components/schemas/Product',
                  },
                },
              },
            },
          },
        },
        ProductListResponse: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              example: 1,
            },
            pageSize: {
              type: 'integer',
              example: 10,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            totalProducts: {
              type: 'integer',
              example: 50,
            },
            products: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product',
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Data retrieved successfully',
            },
            object: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pageNumber: {
              type: 'integer',
              example: 1,
            },
            pageSize: {
              type: 'integer',
              example: 10,
            },
            totalSize: {
              type: 'integer',
              example: 100,
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
