# E-commerce API - Features Documentation

## Overview
This document describes the implemented features: Cookie-Based Authentication, Unit Testing, Redis Caching, Cloudinary Image Uploads, Advanced Search & Filtering, Rate Limiting, and Swagger API Documentation.

## 1. Cookie-Based Authentication

### Overview
The API uses **HTTP-only cookies** for secure authentication instead of returning JWT tokens in response bodies. This provides better security by preventing XSS attacks.

### Features
- **HTTP-only Cookies**: Tokens are stored in HTTP-only cookies (not accessible via JavaScript)
- **Automatic Cookie Management**: Cookies are automatically sent with each request
- **Secure by Default**: 
  - HTTP-only flag prevents JavaScript access
  - Secure flag enabled in production (HTTPS only)
  - SameSite protection mitigates CSRF attacks
- **Backward Compatibility**: Still supports Bearer token authentication via Authorization header

### Configuration
Environment variables for cookie configuration:
```env
COOKIE_NAME=authToken           # Cookie name (default: authToken)
COOKIE_HTTP_ONLY=true          # HTTP-only flag (default: true)
COOKIE_SECURE=false            # Secure flag (auto-enabled in production)
COOKIE_SAME_SITE=lax           # SameSite policy (default: lax)
```

### API Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
**Response:** User object (token is set in cookie automatically)

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
**Response:** User object (token is set in cookie automatically)

#### Logout
```http
POST /auth/logout
```
**Response:** Success message (cookie is cleared)

### Usage
- **Browser**: Cookies are automatically handled - just login and make requests
- **cURL**: Use `-c cookies.txt` to save cookies and `-b cookies.txt` to send them
- **Postman**: Enable cookie handling in settings
- **Frontend**: Ensure CORS is configured with `credentials: true`

### Security Benefits
1. **XSS Protection**: HTTP-only cookies cannot be accessed by JavaScript
2. **CSRF Protection**: SameSite attribute helps prevent CSRF attacks
3. **Secure Transmission**: Secure flag ensures cookies only sent over HTTPS in production
4. **Automatic Management**: No need to manually store or send tokens

## 2. Unit Testing with Jest and Supertest

### Setup
- **Jest** and **Supertest** are configured for testing HTTP endpoints
- Prisma client is mocked to avoid database dependencies in tests
- Test files are located in `src/__tests__/`

### Test Files
- `auth.test.ts` - Tests for authentication endpoints (register, login)
- `products.test.ts` - Tests for product CRUD operations
- `orders.test.ts` - Tests for order creation and history

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

### Test Coverage
- Authentication endpoints (register, login)
- Product endpoints (create, read, update, delete, list, search)
- Order endpoints (create, get history)
- Error handling and validation

## 3. Redis Caching

### Configuration
Redis caching is implemented for the product listing endpoint to improve performance.

### Environment Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional
```

### Features
- **Automatic Caching**: Product list queries are cached for 1 hour (3600 seconds)
- **Cache Invalidation**: Cache is automatically invalidated when products are created, updated, or deleted
- **Cache Key Generation**: Unique cache keys based on query parameters (page, limit, category, search, price range, sorting)
- **Graceful Degradation**: If Redis is unavailable, the API continues to work with database queries

### Cache Keys Format
```
products:page:1:limit:10:category:Electronics:search:Laptop:minPrice:100:maxPrice:1000:sortBy:price:sortOrder:asc
```

### Usage
The caching is transparent - no changes needed in API calls. The service layer automatically:
1. Checks cache before querying database
2. Stores results in cache after database query
3. Invalidates cache on product mutations

## 4. Cloudinary Image Uploads

### Configuration
Cloudinary is integrated for product image uploads.

### Environment Variables
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Features
- **Image Upload**: Products can include images uploaded via multipart/form-data
- **Automatic Optimization**: Images are automatically optimized (800x800 max, auto quality, auto format)
- **Image Deletion**: Old images are automatically deleted from Cloudinary when products are updated
- **File Validation**: Only image files (jpg, jpeg, png, webp, gif) are accepted
- **File Size Limit**: Maximum 5MB per image

### API Usage

#### Create Product with Image
```bash
POST /products
Content-Type: multipart/form-data

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stock": 100,
  "category": "Electronics",
  "image": <file>
}
```
**Note:** Requires authentication (admin only). Cookie is automatically sent with request.

#### Update Product with Image
```bash
PUT /products/:id
Content-Type: multipart/form-data

{
  "name": "Updated Name",
  "image": <file>  # Optional - only if updating image
}
```
**Note:** Requires authentication (admin only). Cookie is automatically sent with request.

### Database Schema
The `Product` model now includes an `imageUrl` field:
```prisma
model Product {
  ...
  imageUrl    String?  // Cloudinary image URL
  ...
}
```

## 5. Advanced Search and Filtering

### New Query Parameters

#### Price Range Filtering
- `minPrice`: Minimum price filter (number)
- `maxPrice`: Maximum price filter (number)

#### Sorting
- `sortBy`: Sort field - `price`, `name`, or `createdAt` (default: `createdAt`)
- `sortOrder`: Sort order - `asc` or `desc` (default: `desc`)

### API Examples

#### Filter by Price Range
```bash
GET /products?minPrice=100&maxPrice=500
```

#### Sort by Price (Low to High)
```bash
GET /products?sortBy=price&sortOrder=asc
```

#### Combined Search, Filter, and Sort
```bash
GET /products?search=Laptop&category=Electronics&minPrice=500&maxPrice=2000&sortBy=price&sortOrder=asc&page=1&limit=20
```

### Response Format
The response includes the `imageUrl` field for each product:
```json
{
  "currentPage": 1,
  "pageSize": 10,
  "totalPages": 5,
  "totalProducts": 50,
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 99.99,
      "stock": 100,
      "category": "Electronics",
      "description": "Product description",
      "imageUrl": "https://res.cloudinary.com/..."
    }
  ]
}
```

## 6. Rate Limiting

### Configuration
Rate limiting is implemented using `express-rate-limit` to protect the API from abuse.

### Rate Limiters

#### 1. General API Limiter (`apiLimiter`)
- **Limit**: 100 requests per 15 minutes per IP
- **Applied to**: All general API endpoints
- **Headers**: Returns `RateLimit-*` headers

#### 2. Authentication Limiter (`authLimiter`)
- **Limit**: 5 requests per 15 minutes per IP
- **Applied to**: `/auth/*` endpoints
- **Features**: Doesn't count successful requests (skipSuccessfulRequests: true)

#### 3. Product Creation Limiter (`productCreationLimiter`)
- **Limit**: 20 requests per hour per IP
- **Applied to**: `POST /products` endpoint

#### 4. Order Limiter (`orderLimiter`)
- **Limit**: 10 requests per 15 minutes per IP
- **Applied to**: `POST /orders` endpoint

### Rate Limit Response
When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```
Status Code: `429 Too Many Requests`

### Rate Limit Headers
Responses include rate limit information in headers:
- `RateLimit-Limit`: Maximum number of requests
- `RateLimit-Remaining`: Remaining requests in current window
- `RateLimit-Reset`: Time when the rate limit resets

## 7. Swagger API Documentation

### Overview
Interactive API documentation using Swagger/OpenAPI 3.0 specification.

### Access
Swagger UI is available at:
```
http://localhost:3000/api-docs
```

### Features
- **Interactive Testing**: Test endpoints directly from the documentation
- **JWT Authentication**: Support for Bearer token authentication in Swagger UI
- **Request/Response Examples**: Comprehensive examples for all endpoints
- **Schema Documentation**: Complete schema definitions for all data models
- **Validation Rules**: Documented validation rules and requirements

### Usage
1. Start the server: `npm run dev`
2. Open `http://localhost:3000/api-docs` in your browser
3. Use the "Try it out" feature to test endpoints
4. For authenticated endpoints, click "Authorize" and enter your Bearer token

**Note:** When using cookie-based authentication, you'll need to login first via the `/auth/login` endpoint to get the cookie set. Swagger UI will then automatically send the cookie with subsequent requests if your browser supports it.

## Migration Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Update Environment Variables
Add the following to your `.env` file:
```env
# Cookie Configuration
COOKIE_NAME=authToken
COOKIE_HTTP_ONLY=true
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Run Database Migration
```bash
npm run prisma:migrate
```
This will add the `imageUrl` field to the `Product` model.

### 4. Start Redis (if using local Redis)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or use a cloud Redis service (Redis Cloud, AWS ElastiCache, etc.)
```

### 5. Run Tests
```bash
npm test
```

## Testing the Features

### Test Caching
1. Make a request to `GET /products`
2. Check Redis for cached data
3. Make the same request again - should be faster (served from cache)

### Test Cookie Authentication
1. Login to get a cookie:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt
```

2. Use the cookie for authenticated requests:
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -b cookies.txt
```

### Test Image Upload
1. Create a product with an image:
```bash
curl -X POST http://localhost:3000/products \
  -b cookies.txt \
  -F "name=Test Product" \
  -F "description=Test Description" \
  -F "price=99.99" \
  -F "stock=100" \
  -F "category=Electronics" \
  -F "image=@/path/to/image.jpg"
```

### Test Advanced Search
```bash
# Search with price range and sorting
curl "http://localhost:3000/products?minPrice=100&maxPrice=500&sortBy=price&sortOrder=asc"
```

### Test Rate Limiting
1. Make multiple rapid requests to any endpoint
2. After exceeding the limit, you'll receive a 429 response

## Notes

- **Cookie Authentication**: The API uses HTTP-only cookies for authentication. Tokens are automatically managed - no need to manually handle them. For testing with cURL, use `-c` to save cookies and `-b` to send them.
- **CORS**: When using cookies, make sure CORS is configured with `credentials: true` on both server and client.
- **Redis**: The application gracefully handles Redis connection failures. If Redis is unavailable, it falls back to direct database queries.
- **Cloudinary**: Image uploads are optional. Products can be created without images.
- **Rate Limiting**: Rate limits are per IP address. In production, consider using a reverse proxy (like nginx) to properly identify client IPs.
- **Caching**: Cache TTL is set to 1 hour. Adjust `CACHE_TTL` in `src/services/product.service.ts` if needed.
- **Swagger UI**: Interactive API documentation is available at `/api-docs`. You can test all endpoints directly from the Swagger UI.



