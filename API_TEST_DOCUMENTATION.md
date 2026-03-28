# API Test Documentation - Book Store

**Base URL:** `http://localhost:8080/api/v1`

**Note:** PayOS payment endpoints are currently disabled. Regular testing should use COD (Cash on Delivery) payment method.

---

## Table of Contents
1. [Authentication](#authentication)
2. [Books](#books)
3. [Categories](#categories)
4. [Cart](#cart)
5. [Orders](#orders)
6. [Users](#users)
7. [Addresses](#addresses)
8. [Authors](#authors)
9. [Publishers](#publishers)
10. [Suppliers & Supply Receipts](#suppliers--supply-receipts)
11. [Statistics](#statistics)

---

## Authentication

### 1. Register New User
**POST** `/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "username": "johndoe",
  "phone": "0123456789"
}
```
**Response (201):**
```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "username": "johndoe",
  "fullName": "John Doe",
  "phone": "0123456789",
  "role": "admin",
  "isVerified": false
}
```

### 2. Login
**POST** `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response (200):**
```json
{
  "ok": true,
  "message": "Đăng nhập thành công",
  "accessToken": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "role": "user",
    "avatar": "url"
  }
}
```

### 3. Get Profile
**GET** `/auth/profile`
- **Auth Required:** Yes (Bearer Token)

**Response (200):**
```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "username": "johndoe",
  "fullName": "John Doe",
  "phone": "0123456789",
  "avatar": "https://...",
  "role": "user",
  "isVerified": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 4. Google OAuth
**POST** `/auth/google`
```json
{
  "code": "google_auth_code"
}
```

### 5. Forgot Password
**POST** `/auth/forgot-password`
```json
{
  "email": "user@example.com"
}
```

### 6. Change Password
**POST** `/auth/change-password`
- **Auth Required:** Yes
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

### 7. Update Profile
**PUT** `/auth/profile`
- **Auth Required:** Yes
```json
{
  "fullName": "Jane Doe",
  "phone": "0987654321",
  "avatar": "image_file"
}
```

---

## Books

### 1. Get All Books (with Pagination & Filter)
**GET** `/books?page=1&limit=10&search=java&category=programming&sortBy=price&sortOrder=asc`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by book name
- `category` - Filter by category
- `sortBy` - Sort field (price, createdAt, name)
- `sortOrder` - asc or desc

**Response (200):**
```json
{
  "totalBooks": 50,
  "totalPages": 5,
  "currentPage": 1,
  "books": [
    {
      "_id": "book_id",
      "name": "Java Programming",
      "description": "Learn Java",
      "price": 299000,
      "quantity": 100,
      "imageUrl": ["https://...jpg"],
      "category": "category_id",
      "authors": ["author_id"],
      "publisher": "publisher_id",
      "rating": 4.5,
      "reviews": 10,
      "slug": "java-programming"
    }
  ]
}
```

### 2. Get Book by ID
**GET** `/books/:id`

**Response (200):**
```json
{
  "_id": "book_id",
  "name": "Java Programming",
  "description": "Learn Java",
  "price": 299000,
  "quantity": 100,
  "imageUrl": ["https://...jpg"],
  "category": {
    "_id": "cat_id",
    "name": "Programming"
  },
  "authors": [
    {
      "_id": "author_id",
      "name": "James Gosling"
    }
  ],
  "publisher": {
    "_id": "pub_id",
    "name": "Oracle"
  },
  "rating": 4.5,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 3. Get Best Selling Books (Top 10)
**GET** `/orders/best-selling`

### 4. Get Newest Books (Top 10)
**GET** `/orders/newest`

### 5. Create Book (Admin Only)
**POST** `/books`
- **Auth Required:** Yes (Admin)
```json
{
  "name": "New Book",
  "description": "Book description",
  "price": 250000,
  "quantity": 50,
  "category": "category_id",
  "authors": ["author_id1", "author_id2"],
  "publisher": "publisher_id",
  "imageUrl": ["image_file_1", "image_file_2"]
}
```

### 6. Update Book (Admin Only)
**PUT** `/books/:id`
- **Auth Required:** Yes (Admin)

### 7. Delete Book (Admin Only)
**DELETE** `/books/:id`
- **Auth Required:** Yes (Admin)

---

## Categories

### 1. Get All Categories
**GET** `/categories`

**Response (200):**
```json
[
  {
    "_id": "cat_id",
    "name": "Programming",
    "description": "Programming books",
    "slug": "programming",
    "imageUrl": "https://..."
  }
]
```

### 2. Get Category by Slug
**GET** `/categories/:slug`

### 3. Get Category by ID (Protected)
**GET** `/categories/:id`
- **Auth Required:** Yes

### 4. Create Category (Admin Only)
**POST** `/categories`
- **Auth Required:** Yes (Admin)
```json
{
  "name": "Science",
  "description": "Science books",
  "imageUrl": "image_file"
}
```

### 5. Update Category (Admin Only)
**PUT** `/categories/:id`
- **Auth Required:** Yes (Admin)

### 6. Delete Category (Admin Only)
**DELETE** `/categories/:id`
- **Auth Required:** Yes (Admin)

---

## Cart

### 1. Get User Cart
**GET** `/cart`
- **Auth Required:** Yes

**Response (200):**
```json
{
  "_id": "cart_id",
  "userId": "user_id",
  "items": [
    {
      "bookId": "book_id",
      "quantity": 2,
      "price": 299000,
      "book": {
        "_id": "book_id",
        "name": "Java Programming",
        "price": 299000,
        "imageUrl": ["https://..."]
      }
    }
  ],
  "totalPrice": 598000,
  "totalItems": 2
}
```

### 2. Add to Cart
**POST** `/cart/add`
- **Auth Required:** Yes
```json
{
  "bookId": "book_id",
  "quantity": 2
}
```

### 3. Update Cart Item
**PUT** `/cart/update/:bookId`
- **Auth Required:** Yes
```json
{
  "quantity": 5
}
```

### 4. Remove from Cart
**DELETE** `/cart/remove/:bookId`
- **Auth Required:** Yes

### 5. Clear Cart
**DELETE** `/cart/clear`
- **Auth Required:** Yes

---

## Orders

### 1. Get All Orders (User)
**GET** `/orders?page=1&limit=10`
- **Auth Required:** Yes

**Response (200):**
```json
{
  "totalOrders": 5,
  "totalPages": 1,
  "currentPage": 1,
  "orders": [
    {
      "_id": "order_id",
      "customerId": "user_id",
      "orderCode": "ORD-001",
      "totalAmount": 598000,
      "paymentMethod": "COD",
      "paymentStatus": "pending",
      "purchaseStatus": "pending",
      "shippingAddress": "Address object",
      "orderDetails": [
        {
          "bookId": "book_id",
          "quantity": 2,
          "price": 299000
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Get Order by ID
**GET** `/orders/:id`
- **Auth Required:** Yes

### 3. Create Order
**POST** `/orders/create`
- **Auth Required:** Yes
```json
{
  "shippingAddressId": "address_id",
  "paymentMethod": "COD"
}
```
**Note:** Payment method can be "COD" or "CARD". PayOS is currently disabled.

### 4. Cancel Order
**PUT** `/orders/cancel/:id`
- **Auth Required:** Yes

### 5. Get Order Statistics (Admin)
**GET** `/statistics/orders`
- **Auth Required:** Yes (Admin)

---

## Users

### 1. Get All Users (Admin Only)
**GET** `/users?page=1&limit=10`
- **Auth Required:** Yes (Admin)

### 2. Get User by ID
**GET** `/users/:id`
- **Auth Required:** Yes

### 3. Update User (Admin Only)
**PUT** `/users/:id`
- **Auth Required:** Yes (Admin)
```json
{
  "fullName": "New Name",
  "phone": "0123456789",
  "role": "user"
}
```

### 4. Delete User (Admin Only)
**DELETE** `/users/:id`
- **Auth Required:** Yes (Admin)

### 5. Ban/Unban User (Admin Only)
**PUT** `/users/:id/ban`
- **Auth Required:** Yes (Admin)

---

## Addresses

### 1. Get All Provinces
**GET** `/address/provinces`

**Response (200):**
```json
{
  "data": [
    {
      "id": "01",
      "name": "Hà Nội"
    }
  ]
}
```

### 2. Get Districts by Province ID
**GET** `/address/districts/:provinceId`

### 3. Get User Addresses
**GET** `/address`
- **Auth Required:** Yes

**Response (200):**
```json
[
  {
    "_id": "address_id",
    "userId": "user_id",
    "fullName": "John Doe",
    "phone": "0123456789",
    "province": "Hà Nội",
    "district": "Ba Đình",
    "ward": "Phúc Tân",
    "address": "123 Street",
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### 4. Create Address
**POST** `/address`
- **Auth Required:** Yes
```json
{
  "fullName": "John Doe",
  "phone": "0123456789",
  "province": "Hà Nội",
  "district": "Ba Đình",
  "ward": "Phúc Tân",
  "address": "123 Street",
  "isDefault": false
}
```

### 5. Update Address
**PUT** `/address/:id`
- **Auth Required:** Yes

### 6. Delete Address
**DELETE** `/address/:id`
- **Auth Required:** Yes

---

## Authors

### 1. Get All Authors
**GET** `/authors?page=1&limit=10`

### 2. Get Author by ID
**GET** `/authors/:id`

### 3. Create Author (Admin Only)
**POST** `/authors`
- **Auth Required:** Yes (Admin)
```json
{
  "name": "James Gosling",
  "description": "Creator of Java",
  "imageUrl": "image_file"
}
```

### 4. Update Author (Admin Only)
**PUT** `/authors/:id`
- **Auth Required:** Yes (Admin)

### 5. Delete Author (Admin Only)
**DELETE** `/authors/:id`
- **Auth Required:** Yes (Admin)

---

## Publishers

### 1. Get All Publishers
**GET** `/publishers?page=1&limit=10`

### 2. Get Publisher by ID
**GET** `/publishers/:id`

### 3. Create Publisher (Admin Only)
**POST** `/publishers`
- **Auth Required:** Yes (Admin)
```json
{
  "name": "Oracle",
  "description": "Software company",
  "imageUrl": "image_file"
}
```

### 4. Update Publisher (Admin Only)
**PUT** `/publishers/:id`
- **Auth Required:** Yes (Admin)

### 5. Delete Publisher (Admin Only)
**DELETE** `/publishers/:id`
- **Auth Required:** Yes (Admin)

---

## Suppliers & Supply Receipts

### 1. Get All Suppliers
**GET** `/suppliers?page=1&limit=10`
- **Auth Required:** Yes (Admin)

### 2. Create Supply Receipt (Admin Only)
**POST** `/supply-receipts`
- **Auth Required:** Yes (Admin)
```json
{
  "supplierId": "supplier_id",
  "receiptDate": "2024-01-15",
  "description": "Book supply",
  "supplyDetails": [
    {
      "bookId": "book_id",
      "quantity": 10,
      "unitPrice": 200000
    }
  ]
}
```

### 3. Get All Supply Receipts (Admin)
**GET** `/supply-receipts?page=1&limit=10`
- **Auth Required:** Yes (Admin)

---

## Statistics

### 1. Get Revenue Statistics (Admin)
**GET** `/statistics?startDate=2024-01-01&endDate=2024-12-31`
- **Auth Required:** Yes (Admin)

**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "totalRevenue": 5000000,
  "totalOrders": 100,
  "totalCustomers": 50,
  "topBooks": [
    {
      "book": "book_id",
      "name": "Java Programming",
      "totalSold": 25,
      "revenue": 7475000
    }
  ]
}
```

---

## Test Scenarios

### Scenario 1: Browse Books Without Login
1. GET `/books` - Get all books
2. GET `/books/category/programming` - Get books by category
3. GET `/books/:id` - View book details

### Scenario 2: User Registration and Login
1. POST `/auth/register` - Create new account
2. POST `/auth/login` - Login
3. GET `/auth/profile` - View profile
4. PUT `/auth/profile` - Update profile

### Scenario 3: Shopping Flow
1. GET `/categories` - Browse categories
2. GET `/books` - Search and filter books
3. GET `/books/:id` - View book details
4. POST `/cart/add` - Add to cart
5. GET `/cart` - View cart
6. POST `/address` - Add shipping address
7. POST `/orders/create` - Create order (COD payment)
8. GET `/orders` - View my orders

### Scenario 4: Admin Operations
1. Login as admin
2. POST `/books` - Create new book
3. POST `/categories` - Create category
4. PUT `/books/:id` - Update book
5. DELETE `/books/:id` - Delete book
6. GET `/statistics` - View statistics

### Scenario 5: Order Management
1. POST `/orders/create` - Create order
2. GET `/orders/:id` - View order details
3. PUT `/orders/cancel/:id` - Cancel order

---

## Common Headers

### All Authenticated Requests
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### File Upload Requests
```
Content-Type: multipart/form-data
Authorization: Bearer {accessToken}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "message": "Token required or invalid"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Admin role required"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Testing Tools

### Using cURL
```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","fullName":"Test User","username":"testuser","phone":"0123456789"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Get books with token
curl -X GET http://localhost:8080/api/v1/books \
  -H "Authorization: Bearer {token}"
```

### Using Postman
1. Import the collection
2. Set `base_url` to `http://localhost:8080/api/v1`
3. Use environment variables for `token` and `userId`
4. Follow test scenarios above

### Using REST Client (VS Code)
Create a `requests.http` file in your project and use the REST Client extension

---

## Notes

- **PayOS Payment:** Currently disabled. Use COD payment method for testing orders.
- **Image Uploads:** Maximum 10 images per book
- **Authentication:** JWT tokens expire in 1 day
- **Pagination:** Default limit is 10 items per page
- **Rate Limiting:** No rate limiting implemented yet
- **CORS:** Configured for localhost only

---

## Admin Login Credentials

Default admin account (if seeded):
```
Email: admin@bookstore.com
Password: admin36
Username: admin
```

---

**Last Updated:** March 28, 2026
**API Version:** v1
