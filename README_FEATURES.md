# E-commerce API - New Features Documentation

## Overview
This document describes the newly implemented features: Unit Testing, Redis Caching, Cloudinary Image Uploads, Advanced Search & Filtering, and Rate Limiting.

## 1. Unit Testing with Jest and Supertest

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

## 2. Redis Caching

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

## 3. Cloudinary Image Uploads

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
Authorization: Bearer <admin-token>

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stock": 100,
  "category": "Electronics",
  "image": <file>
}
```

#### Update Product with Image
```bash
PUT /products/:id
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>

{
  "name": "Updated Name",
  "image": <file>  # Optional - only if updating image
}
```

### Database Schema
The `Product` model now includes an `imageUrl` field:
```prisma
model Product {
  ...
  imageUrl    String?  // Cloudinary image URL
  ...
}
```

## 4. Advanced Search and Filtering

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

## 5. Rate Limiting

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

## Migration Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Update Environment Variables
Add the following to your `.env` file:
```env
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

### Test Image Upload
1. Create a product with an image:
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer <token>" \
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

- **Redis**: The application gracefully handles Redis connection failures. If Redis is unavailable, it falls back to direct database queries.
- **Cloudinary**: Image uploads are optional. Products can be created without images.
- **Rate Limiting**: Rate limits are per IP address. In production, consider using a reverse proxy (like nginx) to properly identify client IPs.
- **Caching**: Cache TTL is set to 1 hour. Adjust `CACHE_TTL` in `src/services/product.service.ts` if needed.



