import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware.js';
import { swaggerSpec } from './config/swagger.config.js';

dotenv.config();

const app: Application = express();

// CORS configuration to allow credentials (cookies)
// Allow all origins in development, restrict in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : process.env.NODE_ENV === 'production' 
      ? false 
      : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Swagger API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'E-Commerce API Documentation',
  })
);

app.use('/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/products', apiLimiter, productRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/orders', apiLimiter, orderRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
