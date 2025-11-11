import app from './app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(` Server is running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  // eslint-disable-next-line no-console
  console.log(`Health check: http://localhost:${PORT}/health`);
  // eslint-disable-next-line no-console
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  // eslint-disable-next-line no-console
  console.log(`Auth Base URL: http://localhost:${PORT}/auth`);
});

process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    // eslint-disable-next-line no-console
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    // eslint-disable-next-line no-console
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('unhandledRejection', (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Promise Rejection:', err);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
});
