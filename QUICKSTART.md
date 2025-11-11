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

# Cookie Configuration (Optional)
COOKIE_NAME=authToken
COOKIE_HTTP_ONLY=true
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# CORS Configuration (Optional)
CORS_ORIGIN=http://localhost:3000
```

**Important:** 
- Replace `username` and `password` with your PostgreSQL credentials
- Generate a secure JWT_SECRET (e.g., `openssl rand -base64 32`)

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

### Using cURL with Cookies

The API uses HTTP-only cookies for authentication. When using cURL, you need to save and use cookies.

### 1. Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

**Note:** The `-c cookies.txt` flag saves the authentication cookie. The token is automatically set in a cookie - no need to manually extract it.

### 2. Login (Alternative to Register)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

### 3. Get User Profile (Authenticated)

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -b cookies.txt
```

**Note:** The `-b cookies.txt` flag sends the saved cookie with the request.

### 4. Create a Product

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: multipart/form-data" \
  -b cookies.txt \
  -F "name=Test Product" \
  -F "description=This is a test product" \
  -F "price=99.99" \
  -F "stock=100" \
  -F "category=Electronics"
```

**Note:** Requires admin authentication. Use `-b cookies.txt` to send the cookie.

### 5. Get All Products

```bash
curl http://localhost:3000/products
```

**Note:** This endpoint is public - no authentication required.

### 6. Create an Order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "description": "My first order",
    "products": [
      {
        "productId": "PRODUCT_ID_FROM_STEP_4",
        "quantity": 2
      }
    ]
  }'
```

### 7. Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

This clears the authentication cookie.

## Using Browser or Postman

When using a browser or Postman:
1. **Login/Register** - The cookie is automatically set
2. **Make requests** - The cookie is automatically sent
3. **Logout** - Clears the cookie

No need to manually handle tokens or cookies - it's all automatic!

## Using Swagger UI

Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

You can test all endpoints directly from the Swagger UI. For authenticated endpoints, you'll need to login first to get the cookie set.

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
- Check [README_FEATURES.md](README_FEATURES.md) for advanced features (Redis, Cloudinary, etc.)
- Explore all endpoints using Swagger UI at `http://localhost:3000/api-docs`
- Use Postman or similar tools with cookie support
- Check the code structure in `src/` directory

## Important Notes

- **Authentication**: The API uses HTTP-only cookies. Tokens are automatically managed - you don't need to manually handle them.
- **CORS**: Make sure your frontend is configured to send credentials (cookies) if calling from a different origin.
- **Swagger UI**: Interactive API documentation is available at `/api-docs` endpoint.
- **Environment Variables**: See `.env.example` for all available configuration options.




