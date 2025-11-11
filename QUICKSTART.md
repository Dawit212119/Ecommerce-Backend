# Quick Start Guide

## Prerequisites Setup

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/
   - Create a database named `ecommerce_db`

2. **Install Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

**Important:** Replace `username` and `password` with your PostgreSQL credentials.

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate
```

When prompted for a migration name, enter: `init`

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The server will start on `http://localhost:3000`

### 5. Verify Installation

Open your browser or use curl:
```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response.

### 2. Create a Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Product",
    "description": "This is a test product",
    "price": 99.99,
    "stock": 100,
    "category": "Electronics"
  }'
```

### 3. Get All Products

```bash
curl http://localhost:3000/api/products
```

### 4. Create an Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "description": "My first order",
    "products": [
      {
        "productId": "PRODUCT_ID_FROM_STEP_2",
        "quantity": 2
      }
    ]
  }'
```

## Common Issues

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Ensure database `ecommerce_db` exists

### Port Already in Use
- Change PORT in `.env` file
- Or stop the process using port 3000

### Prisma Client Not Generated
- Run: `npm run prisma:generate`

### Migration Errors
- Make sure database exists
- Check DATABASE_URL is correct
- Try: `npm run prisma:migrate reset` (WARNING: This deletes all data)

## Next Steps

- Read the full [README.md](README.md) for complete API documentation
- Explore all endpoints using Postman or similar tools
- Check the code structure in `src/` directory




