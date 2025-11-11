
import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware.js';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/products', apiLimiter, productRoutes); 
app.use('/api/products', apiLimiter, productRoutes); 
app.use('/orders', apiLimiter, orderRoutes); 
app.use('/api/orders', apiLimiter, orderRoutes); 

app.use(notFoundHandler);
app.use(errorHandler);

export default app;


