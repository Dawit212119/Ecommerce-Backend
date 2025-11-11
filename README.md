# E-Commerce REST API

A comprehensive REST API for an e-commerce platform built with Express.js, Prisma, PostgreSQL, and JWT authentication. The API follows clean architecture principles (MVC pattern) and provides scalable, well-documented endpoints for managing users, products, and orders.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure password hashing
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
http://localhost:3000/api
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

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## 🔐 User Endpoints

### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
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
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  },
  "errors": null
}
```

### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
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
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  },
  "errors": null
}
```

### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
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
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "errors": null
}
```

---

## 📦 Product Endpoints

### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stock": 50,
  "category": "Electronics"
}
```

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
GET /api/products?page=1&pageSize=10&category=Electronics&search=laptop
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10, max: 100)
- `category` (optional): Filter by category
- `search` (optional): Search in name and description
- `userId` (optional): Filter by user ID

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
GET /api/products/:id
```

### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Laptop",
  "price": 899.99,
  "stock": 45
}
```

**Note:** Only the product owner can update their products.

### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

**Note:** Only the product owner can delete their products.

---

## 🛒 Order Endpoints

### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
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

### Get All Orders
```http
GET /api/orders?page=1&pageSize=10&status=pending
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (pending, processing, shipped, delivered, cancelled)

**Note:** Users can only see their own orders.

### Get Order by ID
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

**Note:** Users can only view their own orders.

### Update Order Status
```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
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
│   │   └── validation.middleware.js
│   ├── utils/                 # Utility functions
│   │   ├── response.util.js
│   │   ├── jwt.util.js
│   │   └── password.util.js
│   ├── app.js                 # Express app configuration
│   └── server.js              # Server entry point
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Input validation and sanitization
- SQL injection protection (Prisma ORM)
- CORS configuration
- Environment variable management

## 🧪 Testing

You can test the API using tools like:
- Postman
- cURL
- Thunder Client (VS Code extension)
- Insomnia

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




