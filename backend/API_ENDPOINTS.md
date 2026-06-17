# E-commerce Backend API Documentation

## Base URL
```
http://localhost:8080/api
```

## Common Response Structure

### Success Response (ApiResponse)
```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response (ErrorResponse)
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: email: must be a well-formed email address",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Paginated Response
```json
{
  "content": [],
  "currentPage": 0,
  "totalPages": 10,
  "totalElements": 200,
  "pageSize": 20,
  "first": true,
  "last": false
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER"
    }
  },
  "message": "User registered successfully"
}
```

### GET /api/auth/check-username
Check if username is available.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| username | string | Username to check |

**Response:**
```json
{
  "success": true,
  "data": true
}
```

### GET /api/auth/check-email
Check if email is available.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| email | string | Email to check |

**Response:**
```json
{
  "success": true,
  "data": true
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER"
    }
  },
  "message": "Login successful"
}
```
**Note:** Sets HTTP-only `refreshToken` cookie.

### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:** Same as login response.

### POST /api/auth/logout
Logout user.

**Response:**
```json
{
  "success": true,
  "data": "Logged out successfully",
  "message": "Logged out successfully"
}
```

### GET /api/auth/profile
Get authenticated user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "john@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "address": "123 Main St",
    "profilePictureUrl": "https://...",
    "bio": "Hello world",
    "role": "USER",
    "status": "ACTIVE"
  }
}
```

### PUT /api/auth/profile
Update user profile.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "address": "123 Main St",
  "profilePictureUrl": "https://...",
  "bio": "Hello world"
}
```

### PUT /api/auth/password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123",
  "confirmNewPassword": "newpassword123"
}
```

### DELETE /api/auth/me
Delete user account.

**Request Body:**
```json
{
  "username": "johndoe"
}
```

---

## Product Endpoints

### GET /api/products
Get paginated list of products with filtering.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| page | int | Page number (default: 0) |
| size | int | Page size (default: 12) |
| search | string | Search keyword |
| category | string | Comma-separated category slugs |
| brand | string | Comma-separated brand slugs |
| minPrice | BigDecimal | Minimum price filter |
| maxPrice | BigDecimal | Maximum price filter |
| minRating | int | Minimum rating filter |
| sort | string | Sort option: newest, price-asc, price-desc, rating |

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "brand": { "id": 1, "name": "Brand Name" },
      "category": { "id": 1, "name": "Category", "slug": "category-slug" },
      "price": 99.99,
      "originalPrice": 149.99,
      "stock": 100,
      "isActive": true,
      "isFeatured": false,
      "primaryImageUrl": "https://...",
      "averageRating": 4.5,
      "reviewCount": 25,
      "images": [...],
      "specs": [...],
      "tags": ["tag1", "tag2"],
      "isWishlisted": false
    }
  ],
  "currentPage": 0,
  "totalPages": 5,
  "totalElements": 60,
  "pageSize": 12,
  "first": true,
  "last": false
}
```

### GET /api/product/{prodId}
Get single product by ID.

**Response:**
```json
{
  "success": true,
  "data": { ... ProductResponse ... }
}
```

### GET /api/product/{productId}/related
Get related products.

**Response:**
```json
[
  { ... ProductResponse ... }
]
```

### GET /api/product/{productId}/also-bought
Get "also bought" products.

**Response:**
```json
[
  { ... ProductResponse ... }
]
```

### GET /api/products/search
Search products.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| keyword | string | Search keyword |
| page | int | Page number (default: 0) |
| size | int | Page size (default: 12) |

### GET /api/products/search/suggestions
Get search suggestions.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| q | string | Search query |
| limit | int | Limit results (default: 5) |

**Response:**
```json
[
  {
    "id": 1,
    "name": "Product Name",
    "category": { "name": "Category", "slug": "category" },
    "price": 99.99,
    "imageUrl": "https://..."
  }
]
```

### POST /api/product (ADMIN)
Create product with multipart form data.

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| request | JSON | AdminProductRequest JSON |
| imageFile | file | Optional product image |

### PUT /api/product/{id} (ADMIN)
Update product.

### DELETE /api/product/{id} (ADMIN)
Delete product.

**Response:**
```json
"deleted"
```

### GET /api/admin/products (ADMIN)
Get admin product list.

### POST /api/admin/products (ADMIN)
Create product (duplicate endpoint).

### PUT /api/admin/products/{id} (ADMIN)
Update product (duplicate endpoint).

---

## Cart Endpoints

### GET /api/cart
Get user's cart.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "product": { ... ProductResponse ... },
      "quantity": 2,
      "lineTotal": 199.98
    }
  ],
  "subtotal": 199.98,
  "itemCount": 2
}
```

### POST /api/cart/items
Add item to cart.

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

### PUT /api/cart/items/{id}
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /api/cart/items/{id}
Remove item from cart.

### POST /api/cart/sync
Sync entire cart with local state.

**Request Body:**
```json
{
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 2, "quantity": 1 }
  ]
}
```

---

## Wishlist Endpoints

### GET /api/wishlist
Get user's wishlist.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| sort | string | Sort by: date_added, price_low, price_high (default: date_added) |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "productId": 123,
      "product": { ... ProductResponse ... },
      "addedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalCount": 5
}
```

### POST /api/wishlist
Add product to wishlist.

**Request Body:**
```json
{
  "productId": 123
}
```

### DELETE /api/wishlist/{productId}
Remove product from wishlist.

---

## Order Endpoints

### POST /api/orders/initiate
Initiate order (before payment).

**Request Body:**
```json
{
  "addressId": 1,
  "addressSnapshot": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "line1": "123 Main St",
    "line2": "Apt 4",
    "city": "New York",
    "state": "NY",
    "pinCode": "10001",
    "country": "USA"
  },
  "couponCode": "SAVE10",
  "shippingMethod": "STANDARD"
}
```

**Response:**
```json
{
  "orderId": 123,
  "totalAmount": 199.99,
  "discountAmount": 10.00
}
```

### POST /api/orders/{id}/confirm
Confirm order after payment.

**Request Body:**
```json
{
  "paymentIntentId": "pi_123456"
}
```

### GET /api/orders
Get user's orders (paginated).

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| status | string | Filter by status: ALL, PENDING, PAID, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| page | int | Page number (default: 0) |
| pageSize | int | Page size (default: 10) |

**Response:**
```json
{
  "content": [
    {
      "id": 123,
      "createdAt": "2024-01-15T10:30:00Z",
      "itemCount": 2,
      "totalAmount": 199.99,
      "status": "PAID",
      "items": [ ... OrderSummaryItemDTO ... ]
    }
  ],
  "currentPage": 0,
  "totalPages": 2,
  "totalElements": 20,
  "pageSize": 10,
  "first": true,
  "last": false
}
```

### GET /api/orders/{id}
Get order details.

**Response:**
```json
{
  "id": 123,
  "createdAt": "2024-01-15T10:30:00Z",
  "paymentMethod": "CARD",
  "deliveryAddress": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "line1": "123 Main St",
    "line2": "Apt 4",
    "city": "New York",
    "state": "NY",
    "pinCode": "10001",
    "country": "USA"
  },
  "items": [
    {
      "productId": 1,
      "productName": "Product Name",
      "productBrand": "Brand",
      "productImageUrl": "https://...",
      "quantity": 2,
      "unitPrice": 99.99,
      "subtotal": 199.98
    }
  ],
  "subtotal": 199.98,
  "discountAmount": 10.00,
  "taxAmount": 16.00,
  "shippingFee": 5.00,
  "totalAmount": 199.99,
  "status": "PAID",
  "trackingNumber": "TRK123456",
  "courierName": "FedEx",
  "statusHistory": [
    {
      "status": "PAID",
      "changedAt": "2024-01-15T10:30:00Z",
      "note": "Payment received"
    }
  ]
}
```

### PUT /api/orders/{id}/cancel
Cancel order.

### PATCH /api/orders/{id}/status (ADMIN)
Update order status.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| status | string | New status (PENDING, PAID, CONFIRMED, SHIPPED, DELIVERED, CANCELLED) |

### PATCH /api/orders/{id}/tracking (ADMIN)
Update tracking information.

**Request Body:**
```json
{
  "trackingNumber": "TRK123456",
  "trackingUrl": "https://track.example.com/TRK123456",
  "shippingCarrier": "FedEx"
}
```

---

## Category Endpoints

### GET /api/categories
Get all categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "icon": "📱",
      "description": "Electronic items",
      "parentId": 2
    }
  ]
}
```

### POST /api/categories (ADMIN)
Create category.

**Request Body:**
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "icon": "📱",
  "description": "Electronic items",
  "parentId": 2
}
```

### PUT /api/categories/{id} (ADMIN)
Update category.

### DELETE /api/categories/{id} (ADMIN)
Delete category.

---

## Brand Endpoints

### GET /api/brands
Get all brands.

### GET /api/brands?categoryId={id}
Get brands by category.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Apple",
    "slug": "apple"
  }
]
```

### POST /api/brands (ADMIN)
Create brand.

**Request Body:**
```json
{
  "name": "Apple",
  "slug": "apple"
}
```

### PUT /api/brands/{id} (ADMIN)
Update brand.

---

## Coupon Endpoints

### POST /api/coupons/validate
Validate coupon code.

**Request Body:**
```json
{
  "code": "SAVE10",
  "orderSubtotal": 99.99
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "discountAmount": 9.99,
    "message": "Coupon applied successfully"
  }
}
```

---

## Shipping Endpoints

### GET /api/shipping/estimate
Get shipping cost estimate.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| subtotal | string | Order subtotal |
| method | string | Shipping method: STANDARD, EXPRESS (default: STANDARD) |

**Response:**
```json
{
  "success": true,
  "data": 5.99
}
```

---

## Payment Endpoints

### POST /api/payment/create-checkout-session
Create Stripe checkout session.

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "productName": "Product",
      "productBrand": "Brand",
      "productImageUrl": "https://...",
      "quantity": 2,
      "unitPrice": 99.99,
      "lineTotal": 199.98
    }
  ],
  "customerEmail": "john@example.com",
  "couponCode": "SAVE10",
  "discountAmount": 10.00,
  "shippingAddress": "123 Main St, New York, NY 10001",
  "shippingCost": 5.99,
  "shippingMethod": "STANDARD"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_123456",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "orderId": 123,
  "shippingCost": 5.99,
  "shippingMethod": "STANDARD"
}
```

### GET /api/payment/session/{sessionId}
Get checkout session status.

---

## Admin Endpoints

### GET /api/admin/stats
Get dashboard statistics.

**Response:**
```json
{
  "users": {
    "total": 500,
    "newLast30Days": 50,
    "change30dPercent": 10.5
  },
  "orders": {
    "total": 150,
    "pending": 25,
    "confirmedToday": 10,
    "change30dPercent": 15.2
  },
  "revenue": {
    "total": 15000.00,
    "last30Days": 1200.00,
    "change30dPercent": 8.3
  },
  "products": {
    "total": 200,
    "active": 180,
    "lowStock": 10
  }
}
```

### GET /api/admin/analytics/revenue
Get revenue analytics.

### GET /api/admin/analytics/orders
Get order analytics.

### GET /api/admin/analytics/products
Get product analytics.

### GET /api/admin/analytics/users
Get user analytics.

### GET /api/admin/orders
Get all orders (admin).

### PUT /api/admin/orders/{id}/status
Update order status (admin).

**Request Body:**
```json
{
  "status": "SHIPPED",
  "note": "Shipped via FedEx",
  "trackingNumber": "TRK123456",
  "courierName": "FedEx"
}
```

### POST /api/admin/orders/{id}/resend-email
Resend order confirmation email.

---

## Admin User Management Endpoints

### GET /api/admin/users
Get all users with search and pagination.

**Response:**
```json
{
  "content": [
    {
      "userId": 1,
      "email": "john@example.com",
      "username": "johndoe",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  ],
  "currentPage": 0,
  "totalPages": 5,
  "totalElements": 100,
  "pageSize": 20,
  "first": true,
  "last": false
}
```

### GET /api/admin/users/{userId}
Get user details with addresses and recent orders.

**Response:**
```json
{
  "userId": 1,
  "email": "john@example.com",
  "username": "johndoe",
  "role": "USER",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLoginAt": "2024-01-15T10:30:00Z",
  "orderCount": 15,
  "totalSpent": 1250.00,
  "addresses": [
    {
      "fullName": "John Doe",
      "phone": "+1234567890",
      "line1": "123 Main St",
      "line2": "Apt 4",
      "city": "New York",
      "state": "NY",
      "pinCode": "10001",
      "country": "USA"
    }
  ],
  "recentOrders": [ ... ]
}
```

### PUT /api/admin/users/{userId}/role
Change user role.

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

### PATCH /api/admin/users/{userId}/status
Change user status.

**Request Body:**
```json
{
  "status": "SUSPENDED"
}
```

### DELETE /api/admin/users/{userId}
Delete user.

---

## Recently Viewed Endpoints

### GET /api/users/me/recently-viewed
Get recently viewed products.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| limit | int | Limit results (default: 20) |

### POST /api/users/me/recently-viewed
Add to recently viewed.

**Request Body:**
```json
{
  "productId": 123
}
```

### DELETE /api/users/me/recently-viewed
Clear recently viewed history.

---

## Address Endpoints

### GET /api/users/me/addresses
Get user's addresses.

### POST /api/users/me/addresses
Create address.

**Request Body:**
```json
{
  "label": "Home",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "line1": "123 Main St",
  "line2": "Apt 4",
  "city": "New York",
  "state": "NY",
  "pinCode": "10001",
  "country": "USA"
}
```

### PUT /api/users/me/addresses/{id}
Update address.

### DELETE /api/users/me/addresses/{id}
Delete address.

### PATCH /api/users/me/addresses/{id}/default
Set as default address.

---

## Review Endpoints

### POST /api/reviews
Create product review.

**Request Body:**
```json
{
  "productId": 123,
  "orderId": 456,
  "rating": 5,
  "title": "Great product!",
  "body": "This product exceeded my expectations...",
  "imageUrls": ["https://...", "https://..."]
}
```

### GET /api/reviews/product/{productId}
Get product reviews.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| page | int | Page number (default: 0) |
| size | int | Page size (default: 5) |
| sort | string | Sort: newest, oldest, highest, lowest (default: newest) |
| minRating | int | Filter by minimum rating |

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "averageRating": 4.5,
      "totalReviews": 25,
      "ratingDistribution": { "5": 15, "4": 8, "3": 2 }
    },
    "content": [ ... ReviewResponse ... ],
    "totalElements": 25,
    "totalPages": 5,
    "currentPage": 0
  }
}
```

### GET /api/reviews/my-review/{productId}
Get current user's review for a product.

### GET /api/reviews/check-eligibility/{productId}
Check if user can review product (must have purchased and received).

### PUT /api/reviews/{id}
Update review.

### DELETE /api/reviews/{id}
Delete review.

### POST /api/reviews/{id}/vote
Vote on review (helpful/not helpful).

**Request Body:**
```json
{
  "vote": "HELPFUL"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "helpfulCount": 10,
    "notHelpfulCount": 2
  }
}
```

### POST /api/reviews/{id}/report
Report review.

**Request Body:**
```json
{
  "reason": "Inappropriate content"
}
```

---

## Data Models

### User
| Property | Type | Description |
|----------|------|-------------|
| userId | Long | Unique identifier |
| email | String | User email (unique) |
| username | String | Username (unique) |
| password | String | Hashed password |
| role | Role | USER or ADMIN |
| status | UserStatus | ACTIVE, SUSPENDED, BANNED, DELETED |
| fullName | String | Full name |
| phoneNumber | String | Phone number |
| address | String | Address |
| profilePictureUrl | String | Profile picture URL |
| bio | String | User bio |
| createdAt | LocalDateTime | Account creation time |
| updatedAt | LocalDateTime | Last update time |
| lastLoginAt | LocalDateTime | Last login time |

### Product
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| name | String | Product name |
| description | String | Product description |
| price | BigDecimal | Selling price |
| originalPrice | BigDecimal | Original/MRP price |
| stockQuantity | Long | Available stock |
| productAvailable | boolean | Is product available |
| isActive | boolean | Is active |
| isFeatured | boolean | Is featured |
| imageUrl | String | Primary image URL |
| averageRating | Double | Average rating |
| reviewCount | Long | Number of reviews |
| categoryEntity | Category | Category reference |
| brandEntity | Brand | Brand reference |
| tags | List<ProductTag> | Product tags |
| specs | List<ProductSpec> | Product specifications |

### Category
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| name | String | Category name |
| slug | String | URL slug (unique) |
| icon | String | Icon identifier |
| description | String | Category description |
| parent | Category | Parent category (for subcategories) |

### Brand
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| name | String | Brand name |
| slug | String | URL slug (unique) |

### Order
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| user | User | User who placed order |
| status | OrderStatus | Order status |
| subtotal | BigDecimal | Subtotal amount |
| discountAmount | BigDecimal | Discount applied |
| taxAmount | BigDecimal | Tax amount |
| shippingFee | BigDecimal | Shipping fee |
| shippingMethod | String | Shipping method |
| totalAmount | BigDecimal | Total amount |
| customerEmail | String | Customer email |
| trackingNumber | String | Tracking number |
| trackingUrl | String | Tracking URL |
| shippingCarrier | String | Carrier name |
| deliveryAddress | AddressSnapshot | Delivery address |
| createdAt | LocalDateTime | Order creation time |
| stripeSessionId | String | Stripe session ID |
| stripePaymentIntentId | String | Stripe payment intent ID |

### OrderStatus Enum
`PENDING`, `PAID`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUND_REQUESTED`, `REFUND_PROCESSING`, `REFUNDED`, `FAILED`

### OrderItem
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| productId | Long | Product ID |
| productName | String | Product name at time of order |
| productBrand | String | Brand name at time of order |
| productImageUrl | String | Image URL at time of order |
| quantity | Integer | Quantity ordered |
| unitPrice | BigDecimal | Price per unit |
| subtotal | BigDecimal | Line total |

### Address
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| label | String | Label (Home, Work, etc.) |
| fullName | String | Full name |
| phone | String | Phone number |
| line1 | String | Address line 1 |
| line2 | String | Address line 2 |
| city | String | City |
| state | String | State/Province |
| pinCode | String | Postal/ZIP code |
| country | String | Country |
| isDefault | boolean | Is default address |

### AddressSnapshot (Embedded in Order)
| Property | Type | Description |
|----------|------|-------------|
| fullName | String | Full name |
| phone | String | Phone number |
| line1 | String | Address line 1 |
| line2 | String | Address line 2 |
| city | String | City |
| state | String | State/Province |
| pinCode | String | Postal/ZIP code |
| country | String | Country |

### Coupon
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| code | String | Coupon code (unique) |
| discountType | DiscountType | PERCENTAGE or FIXED |
| discountValue | BigDecimal | Discount value |
| minOrderValue | BigDecimal | Minimum order for coupon |
| maxUses | Integer | Maximum uses |
| usesCount | Integer | Times used |
| expiresAt | LocalDateTime | Expiration date |
| isActive | boolean | Is active |

### DiscountType Enum
`PERCENTAGE`, `FIXED`

### Review
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| user | User | Reviewer |
| product | Product | Product reviewed |
| order | Order | Order reference |
| rating | Integer | Rating (1-5) |
| title | String | Review title |
| body | String | Review body |
| helpfulCount | Integer | Helpful votes |
| notHelpfulCount | Integer | Not helpful votes |
| createdAt | LocalDateTime | Creation time |

### ProductSpec
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| product | Product | Product reference |
| specKey | String | Specification name |
| specValue | String | Specification value |

### ProductTag
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| product | Product | Product reference |
| tag | String | Tag text |
| createdAt | LocalDateTime | Creation time |

### ProductImage
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| product | Product | Product reference |
| url | String | Image URL |
| sortOrder | Integer | Display order |
| isPrimary | boolean | Is primary image |

---

## Error Responses

### Common HTTP Status Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Validation failed or malformed request |
| 401 | Unauthorized - Authentication required or token expired |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource or constraint violation |
| 500 | Internal Server Error - Unexpected server error |

### Validation Error Response
```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "email: must be a well-formed email address; password: Password must be at least 8 characters",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Authentication Error Response
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Authentication required or token expired",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Authorization Error Response
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Not Found Error Response
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Product not found with id: 123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Conflict Error Response
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "A resource with this value already exists",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Internal Server Error Response
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Enumerations

### Role
- `USER` - Regular customer
- `ADMIN` - Administrator

### UserStatus
- `ACTIVE` - Active user
- `SUSPENDED` - Temporarily suspended
- `BANNED` - Permanently banned
- `DELETED` - Soft-deleted account

### OrderStatus
- `PENDING` - Order placed, awaiting payment
- `PAID` - Payment received
- `CONFIRMED` - Order confirmed
- `SHIPPED` - Order shipped
- `DELIVERED` - Order delivered
- `CANCELLED` - Order cancelled
- `REFUND_REQUESTED` - Refund requested
- `REFUND_PROCESSING` - Refund in progress
- `REFUNDED` - Refunded
- `FAILED` - Order failed

### DiscountType
- `PERCENTAGE` - Percentage discount
- `FIXED` - Fixed amount discount

### ReviewVoteType
- `HELPFUL` - Helpful vote
- `NOT_HELPFUL` - Not helpful vote

### PaymentStatus
- `PENDING` - Payment pending
- `SUCCEEDED` - Payment succeeded
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded
- `CANCELLED` - Payment cancelled

### Payment
| Property | Type | Description |
|----------|------|-------------|
| id | Long | Unique identifier |
| order | Order | Associated order |
| stripeSessionId | String | Stripe session ID |
| stripePaymentIntentId | String | Stripe payment intent ID |
| amount | BigDecimal | Payment amount |
| currency | String | Currency code (e.g., "usd") |
| status | PaymentStatus | Payment status |
| paymentMethod | String | Payment method |
| createdAt | LocalDateTime | Creation time |
| updatedAt | LocalDateTime | Last update time |