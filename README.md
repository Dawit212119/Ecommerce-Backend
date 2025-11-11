# E-Commerce REST API

A comprehensive REST API for an e-commerce platform built with Express.js, Prisma, PostgreSQL, and JWT authentication. The API follows clean architecture principles (MVC pattern) and provides scalable, well-documented endpoints for managing users, products, and orders.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure HTTP-only cookies
- **Product Management**: Full CRUD operations for products with pagination and filtering
- **Order Management**: Create and manage orders with automatic stock updates
- **Clean Architecture**: MVC pattern with separation of concerns
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Centralized error handling with meaningful error messages
- **Pagination**: Built-in pagination support for list endpoints
- **Documentation**: Well-documented code and API endpoints

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd A2SV
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_db?schema=public"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   PORT=3000
   NODE_ENV=development
   
   # Cookie Configuration (Optional)
   COOKIE_NAME=authToken
   COOKIE_HTTP_ONLY=true
   COOKIE_SECURE=false  # Set to true in production (HTTPS required)
   COOKIE_SAME_SITE=lax
   
   # CORS Configuration (Optional)
   CORS_ORIGIN=http://localhost:3000  # Comma-separated for multiple origins
   
   # Redis (Optional - for caching)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # Cloudinary (Optional - for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   ```

5. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Swagger UI Documentation
Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

### Response Format

#### Base Response
```json
{
  "success": true,
  "message": "Operation successful",
  "object": { ... },
  "errors": null
}
```

#### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "object": [ ... ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalSize": 100,
  "errors": null
}
```

### Authentication

The API uses **HTTP-only cookies** for authentication. When you login or register, the JWT token is automatically set in a secure cookie.

#### Cookie-Based Authentication (Recommended)
- Tokens are stored in HTTP-only cookies (not accessible via JavaScript)
- Cookies are automatically sent with each request
- More secure than token-based authentication (prevents XSS attacks)
- No need to manually include tokens in requests

#### Backward Compatibility
The API still supports Bearer token authentication via Authorization header for backward compatibility:
```
Authorization: Bearer <your-token>
```

#### Logout
To logout, call the logout endpoint which clears the authentication cookie:
```
POST /auth/logout
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "object": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "errors": null
}
```

**Note:** The JWT token is automatically set in an HTTP-only cookie named `authToken`. The cookie is sent automatically with subsequent requests.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "object": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "errors": null
}
```

**Note:** The JWT token is automatically set in an HTTP-only cookie. No need to manually handle tokens.

### Logout
```http
POST /auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful",
  "object": null,
  "errors": null
}
```

**Note:** This clears the authentication cookie.

### Get Profile
```http
GET /api/users/profile
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "object": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "errors": null
}
```

**Note:** Authentication is handled via cookies automatically. No Authorization header needed.

---

## 📦 Product Endpoints

### Create Product
```http
POST /products
Content-Type: multipart/form-data

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stock": 50,
  "category": "Electronics",
  "image": <file>  # Optional image file
}
```

**Note:** 
- Requires authentication (admin only)
- Image upload is optional
- Supported image formats: jpg, jpeg, png, webp, gif
- Maximum file size: 5MB

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "object": {
    "id": "uuid",
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "stock": 50,
    "category": "Electronics",
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com"
    }
  },
  "errors": null
}
```

### Get All Products
```http
GET /products?page=1&limit=10&category=Electronics&search=laptop&minPrice=100&maxPrice=1000&sortBy=price&sortOrder=asc
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` or `pageSize` (optional): Items per page (default: 10, max: 100)
- `category` (optional): Filter by category
- `search` (optional): Search in product name (case-insensitive, partial match)
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sortBy` (optional): Sort field - `price`, `name`, or `createdAt` (default: `createdAt`)
- `sortOrder` (optional): Sort order - `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "object": [ ... ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalSize": 50,
  "errors": null
}
```

### Get Product by ID
```http
GET /products/:id
```

### Update Product
```http
PUT /products/:id
Content-Type: multipart/form-data

{
  "name": "Updated Laptop",
  "price": 899.99,
  "stock": 45,
  "image": <file>  # Optional - only if updating image
}
```

**Note:** 
- Requires authentication (admin only)
- All fields are optional
- Image upload is optional

### Delete Product
```http
DELETE /products/:id
```

**Note:** Requires authentication (admin only)

---

## 🛒 Order Endpoints

### Create Order
```http
POST /orders
Content-Type: application/json

{
  "description": "Customer order",
  "products": [
    {
      "productId": "product-uuid",
      "quantity": 2
    },
    {
      "productId": "another-product-uuid",
      "quantity": 1
    }
  ]
}
```

**Note:** Requires authentication. User ID is automatically extracted from the JWT token in the cookie.

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "object": {
    "id": "uuid",
    "userId": "uuid",
    "description": "Customer order",
    "totalPrice": 1999.98,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": { ... },
    "orderItems": [
      {
        "id": "uuid",
        "quantity": 2,
        "price": 1999.98,
        "product": { ... }
      }
    ]
  },
  "errors": null
}
```

**Note:** Stock is automatically decremented when an order is created.

### Get Order History
```http
GET /orders
```

**Response:**
```json
[
  {
    "id": "uuid",
    "status": "pending",
    "totalPrice": 199.98,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Note:** 
- Requires authentication
- Returns only the authenticated user's orders
- Returns empty array if user has no orders

### Get All Orders (with pagination)
```http
GET /api/orders?page=1&pageSize=10&status=pending
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (pending, processing, shipped, delivered, cancelled)

**Note:** Requires authentication

### Get Order by ID
```http
GET /api/orders/:id
```

**Note:** Requires authentication

### Update Order Status
```http
PUT /api/orders/:id/status
Content-Type: application/json

{
  "status": "processing"
}
```

**Valid Status Values:**
- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

---

## 🏗️ Project Structure

```
A2SV/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── controllers/           # Request handlers
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   └── order.controller.js
│   ├── services/              # Business logic
│   │   ├── user.service.js
│   │   ├── product.service.js
│   │   └── order.service.js
│   ├── routes/                # Route definitions
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   └── order.routes.js
│   ├── middleware/            # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── upload.middleware.js
│   ├── config/                # Configuration files
│   │   ├── config.js
│   │   └── swagger.config.js
│   ├── docs/                  # API documentation
│   │   └── swagger.ts
│   ├── errors/                # Error classes
│   │   └── AppError.ts
│   ├── utils/                 # Utility functions
│   │   ├── response.util.js
│   │   ├── jwt.util.js
│   │   ├── password.util.js
│   │   ├── redis.util.js
│   │   └── cloudinary.util.js
│   ├── app.js                 # Express app configuration
│   └── server.js              # Server entry point
├── prisma/
│   └── schema.prisma          # Database schema
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with secure salt rounds
- **Cookie-Based Authentication**: HTTP-only cookies prevent XSS attacks
- **JWT Tokens**: Secure token generation and verification
- **Input Validation**: Comprehensive validation using express-validator
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **CORS Configuration**: Configurable CORS with credentials support
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Environment Variables**: Secure management of sensitive data
- **Cookie Security**: 
  - HTTP-only (prevents JavaScript access)
  - Secure flag in production (HTTPS only)
  - SameSite protection (CSRF mitigation)

## 🧪 Testing

### Using cURL with Cookies
When testing with cURL, use the `-c` and `-b` flags to handle cookies:

```bash
# Login and save cookies
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Use cookies for authenticated requests
curl -X GET http://localhost:3000/api/users/profile \
  -b cookies.txt
```

### Using Browser
Cookies are automatically handled by browsers. Simply login and make requests - authentication is automatic.

### Testing Tools
- **Postman**: Enable "Automatically follow redirects" and "Send cookies"
- **Thunder Client** (VS Code): Supports cookie handling
- **Insomnia**: Automatic cookie management
- **Swagger UI**: Interactive documentation at `/api-docs`

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "object": null,
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Authentication required)
- `404` - Not Found
- `409` - Conflict (Duplicate entry)
- `500` - Internal Server Error

## 🚀 Deployment

1. Set `NODE_ENV=production` in your environment variables
2. Use a strong `JWT_SECRET` in production
3. Configure your PostgreSQL database connection
4. Run migrations: `npm run prisma:migrate`
5. Start the server: `npm start`

## 📄 License

ISC

## 👥 Contributing

This is a project for A2SV. Contributions and improvements are welcome!

---

**Built with ❤️ using Express.js, Prisma, and PostgreSQL**




