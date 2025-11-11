/**
 * Order service - Business logic for order operations
 */
import { PrismaClient, Order, OrderItem, Product } from '@prisma/client';

const prisma = new PrismaClient();

export interface OrderProduct {
  productId: string;
  quantity: number;
}

export interface CreateOrderData {
  userId: string;
  description?: string;
  products: OrderProduct[];
}

export interface OrderOptions {
  page?: number | string;
  pageSize?: number | string;
  userId?: string;
  status?: string;
}

export interface OrderWithRelations extends Order {
  user: {
    id: string;
    username: string;
    email: string;
  };
  orderItems: (OrderItem & {
    product: {
      id: string;
      name: string;
      description: string;
      price: number;
      category: string;
    };
  })[];
}

export interface PaginatedOrdersResult {
  orders: OrderWithRelations[];
  pageNumber: number;
  pageSize: number;
  totalSize: number;
}

/**
 * User Story 10: Order summary for order history
 */
export interface OrderSummary {
  order_id: string;
  status: string;
  total_price: number;
  created_at: Date;
}

/**
 * Create a new order (User Story 9)
 * User Story 9: Place a new order with transaction support and proper error handling
 */
export const createOrder = async (orderData: CreateOrderData): Promise<OrderWithRelations> => {
  const { userId, description, products } = orderData;

  // User Story 9: Validate products array
  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new Error('Order must contain at least one product');
  }

  // User Story 9: Calculate total price and validate products
  // Total price is calculated from database prices, not trusted from client
  let totalPrice = 0;
  const orderItems: Array<{ productId: string; quantity: number; price: number }> = [];

  for (const item of products) {
    const { productId, quantity } = item;

    if (!productId || !quantity || quantity <= 0) {
      throw new Error('Invalid product data in order');
    }

    // User Story 9: Get product details from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    // User Story 9: Return 404 Not Found if product doesn't exist
    if (!product) {
      const error = new Error(`Product with ID ${productId} not found`) as Error & {
        statusCode?: number;
      };
      error.statusCode = 404;
      throw error;
    }

    // User Story 9: Check stock availability - return 400 Bad Request if insufficient
    if (product.stock < quantity) {
      const error = new Error(
        `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${quantity}`
      ) as Error & { statusCode?: number };
      error.statusCode = 400;
      throw error;
    }

    // User Story 9: Calculate price from database (not from client)
    const itemPrice = product.price * quantity;
    totalPrice += itemPrice;

    orderItems.push({
      productId,
      quantity,
      price: itemPrice,
    });
  }

  // User Story 9: Create order with order items in a transaction
  // If any part fails, entire transaction is rolled back
  const order = await prisma.$transaction(async tx => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        userId,
        description,
        totalPrice,
        status: 'pending',
      },
    });

    // User Story 9: Create order items and update product stock within transaction
    // If any update fails, entire transaction rolls back
    for (const item of orderItems) {
      // Re-check stock within transaction to prevent race conditions
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        const error = new Error(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        ) as Error & { statusCode?: number };
        error.statusCode = 400;
        throw error;
      }

      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        },
      });

      // User Story 9: Update product stock within transaction
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Return order with all relations
    return await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                category: true,
              },
            },
          },
        },
      },
    });
  });

  return order as OrderWithRelations;
};

/**
 * Get user order history (User Story 10)
 * Returns array of order summaries for the authenticated user
 */
export const getUserOrderHistory = async (userId: string): Promise<OrderSummary[]> => {
  // User Story 10: Filter orders by userId (from JWT)
  const orders = await prisma.order.findMany({
    where: { userId },
    select: {
      // User Story 10: Key summary information
      id: true,
      status: true,
      totalPrice: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // User Story 10: Return array of order summaries
  return orders.map(order => ({
    order_id: order.id,
    status: order.status,
    total_price: order.totalPrice,
    created_at: order.createdAt,
  }));
};

/**
 * Get all orders with pagination (legacy method)
 */
export const getOrders = async (options: OrderOptions = {}): Promise<PaginatedOrdersResult> => {
  const { page = 1, pageSize = 10, userId, status } = options;

  const skip = (parseInt(page.toString()) - 1) * parseInt(pageSize.toString());
  const take = parseInt(pageSize.toString());

  // Build where clause
  const where: any = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  // Get orders and total count
  const [orders, totalSize] = await Promise.all([
    prisma.order.findMany({
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
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders as OrderWithRelations[],
    pageNumber: parseInt(page.toString()),
    pageSize: take,
    totalSize,
  };
};

/**
 * Get order by ID
 */
export const getOrderById = async (
  orderId: string,
  userId: string
): Promise<OrderWithRelations> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Check authorization (users can only view their own orders)
  if (order.userId !== userId) {
    throw new Error('You are not authorized to view this order');
  }

  return order as OrderWithRelations;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  userId: string,
  status: string
): Promise<OrderWithRelations> => {
  // Check if order exists and belongs to user
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  if (existingOrder.userId !== userId) {
    throw new Error('You are not authorized to update this order');
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              category: true,
            },
          },
        },
      },
    },
  });

  return order as OrderWithRelations;
};
