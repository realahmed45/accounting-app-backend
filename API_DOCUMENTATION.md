# 📚 Complete API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1️⃣ Authentication Endpoints

### Register New User

**POST** `/auth/register`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "middleName": "Michael",
  "familyName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response:** (201 Created)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "65abc123...",
      "email": "john@example.com",
      "firstName": "John",
      "middleName": "Michael",
      "familyName": "Doe",
      "fullName": "John Michael Doe",
      "phoneNumber": "+1234567890"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login User

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "65abc123...",
      "email": "john@example.com",
      "firstName": "John",
      "middleName": "Michael",
      "familyName": "Doe",
      "fullName": "John Michael Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User

**GET** `/auth/me`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "65abc123...",
    "email": "john@example.com",
    "firstName": "John",
    "familyName": "Doe",
    "phoneNumber": "+1234567890"
  }
}
```

---

### Update User Details

**PUT** `/auth/updatedetails`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "firstName": "Jonathan",
  "phoneNumber": "+9876543210"
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "65abc123...",
    "email": "john@example.com",
    "firstName": "Jonathan",
    "phoneNumber": "+9876543210"
  }
}
```

---

### Update Password

**PUT** `/auth/updatepassword`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here..."
  }
}
```

---

## 2️⃣ Account Endpoints

### Create New Account

**POST** `/accounts`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "accountName": "Personal Expenses 2024",
  "currency": "USD",
  "timezone": "America/New_York"
}
```

**Response:** (201 Created)

```json
{
  "success": true,
  "data": {
    "_id": "65def456...",
    "accountName": "Personal Expenses 2024",
    "userId": "65abc123...",
    "currency": "USD",
    "timezone": "America/New_York",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note:** Creating an account automatically creates default categories:

- Food & Dining
- Transportation
- Utilities
- Shopping
- Entertainment
- Healthcare
- Other

---

### Get All Accounts

**GET** `/accounts`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65def456...",
      "accountName": "Personal Expenses 2024",
      "userId": "65abc123...",
      "currency": "USD",
      "timezone": "America/New_York",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "65def789...",
      "accountName": "Business Account",
      "userId": "65abc123...",
      "currency": "EUR",
      "timezone": "Europe/London",
      "createdAt": "2024-01-14T08:00:00.000Z"
    }
  ]
}
```

---

### Get Single Account

**GET** `/accounts/:id`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "65def456...",
    "accountName": "Personal Expenses 2024",
    "userId": "65abc123...",
    "currency": "USD",
    "timezone": "America/New_York",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Update Account

**PUT** `/accounts/:id`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "accountName": "Personal - Updated Name",
  "currency": "EUR"
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "65def456...",
    "accountName": "Personal - Updated Name",
    "currency": "EUR",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### Delete Account

**DELETE** `/accounts/:id`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {}
}
```

---

### Get Account Categories

**GET** `/accounts/:id/categories`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "count": 7,
  "data": [
    {
      "_id": "65cat001...",
      "accountId": "65def456...",
      "name": "Food & Dining",
      "isDefault": true
    },
    {
      "_id": "65cat002...",
      "accountId": "65def456...",
      "name": "Transportation",
      "isDefault": true
    },
    {
      "_id": "65cat003...",
      "accountId": "65def456...",
      "name": "Custom Category",
      "isDefault": false
    }
  ]
}
```

---

### Create Category

**POST** `/accounts/:id/categories`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "name": "Office Supplies"
}
```

**Response:** (201 Created)

```json
{
  "success": true,
  "data": {
    "_id": "65cat010...",
    "accountId": "65def456...",
    "name": "Office Supplies",
    "isDefault": false
  }
}
```

---

### Get Account People

**GET** `/accounts/:id/people`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65ppl001...",
      "accountId": "65def456...",
      "name": "John",
      "isCashFlowManager": true,
      "pinCode": "1234"
    },
    {
      "_id": "65ppl002...",
      "accountId": "65def456...",
      "name": "Sarah",
      "isCashFlowManager": false
    }
  ]
}
```

---

### Create Person

**POST** `/accounts/:id/people`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "name": "Mike",
  "isCashFlowManager": true,
  "pinCode": "5678"
}
```

**Response:** (201 Created)

```json
{
  "success": true,
  "data": {
    "_id": "65ppl003...",
    "accountId": "65def456...",
    "name": "Mike",
    "isCashFlowManager": true,
    "pinCode": "5678"
  }
}
```

---

## 3️⃣ Week Endpoints

### Create New Week

**POST** `/weeks`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "accountId": "65def456...",
  "startDate": "2024-01-15",
  "endDate": "2024-01-21",
  "bankBalance": 5000,
  "cashBoxBalance": 500
}
```

**Response:** (201 Created)

```json
{
  "success": true,
  "data": {
    "_id": "65week01...",
    "accountId": "65def456...",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-01-21T23:59:59.999Z",
    "bankBalance": 5000,
    "cashBoxBalance": 500,
    "isLocked": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### Get Weeks by Account

**GET** `/weeks/account/:accountId`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65week03...",
      "accountId": "65def456...",
      "startDate": "2024-01-22T00:00:00.000Z",
      "endDate": "2024-01-28T23:59:59.999Z",
      "bankBalance": 4500,
      "cashBoxBalance": 300,
      "isLocked": false
    },
    {
      "_id": "65week02...",
      "accountId": "65def456...",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-21T23:59:59.999Z",
      "bankBalance": 5000,
      "cashBoxBalance": 500,
      "isLocked": true,
      "lockedAt": "2024-01-21T23:00:00.000Z"
    }
  ]
}
```

---

### Get Single Week

**GET** `/weeks/:id`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "65week01...",
    "accountId": "65def456...",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-01-21T23:59:59.999Z",
    "bankBalance": 5000,
    "cashBoxBalance": 500,
    "isLocked": false
  }
}
```

---

### Update Week

**PUT** `/weeks/:id`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "bankBalance": 4800,
  "cashBoxBalance": 450
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "65week01...",
    "bankBalance": 4800,
    "cashBoxBalance": 450,
    "updatedAt": "2024-01-16T09:00:00.000Z"
  }
}
```

**Note:** Cannot update locked weeks

---

### Lock Week

**PUT** `/weeks/:id/lock`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "65week01...",
    "isLocked": true,
    "lockedAt": "2024-01-21T20:00:00.000Z"
  }
}
```

---

### Delete Week

**DELETE** `/weeks/:id`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {}
}
```

**Note:** Cannot delete locked weeks. All expenses in the week are also deleted.

---

## 4️⃣ Expense Endpoints

### Create Expense

**POST** `/expenses`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "accountId": "65def456...",
  "weekId": "65week01...",
  "date": "2024-01-16",
  "amount": 45.99,
  "category": "Food & Dining",
  "person": "John",
  "note": "Lunch at Italian restaurant",
  "fromBank": true
}
```

**Response:** (201 Created)

```json
{
  "success": true,
  "data": {
    "_id": "65exp001...",
    "accountId": "65def456...",
    "weekId": "65week01...",
    "date": "2024-01-16T00:00:00.000Z",
    "amount": 45.99,
    "category": "Food & Dining",
    "person": "John",
    "note": "Lunch at Italian restaurant",
    "fromBank": true,
    "userId": "65abc123...",
    "createdAt": "2024-01-16T12:30:00.000Z"
  }
}
```

---

### Get Expenses by Week

**GET** `/expenses/week/:weekId`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "65exp001...",
      "amount": 45.99,
      "category": "Food & Dining",
      "person": "John",
      "date": "2024-01-16T00:00:00.000Z",
      "fromBank": true
    },
    {
      "_id": "65exp002...",
      "amount": 120.0,
      "category": "Utilities",
      "person": "Sarah",
      "date": "2024-01-15T00:00:00.000Z",
      "fromBank": false
    }
  ]
}
```

---

### Get Expenses by Account (with filters)

**GET** `/expenses/account/:accountId?startDate=2024-01-01&endDate=2024-01-31&category=Food&person=John`
🔒 **Authentication Required**

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `category` (optional): Filter by category
- `person` (optional): Filter by person

**Response:** (200 OK)

```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "65exp001...",
      "amount": 45.99,
      "category": "Food & Dining",
      "person": "John",
      "note": "Lunch",
      "date": "2024-01-16T00:00:00.000Z"
    }
  ]
}
```

---

### Get Single Expense (with photos)

**GET** `/expenses/:id`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "expense": {
      "_id": "65exp001...",
      "amount": 45.99,
      "category": "Food & Dining",
      "person": "John",
      "note": "Lunch at restaurant"
    },
    "photos": [
      {
        "_id": "65photo01...",
        "fileUrl": "https://res.cloudinary.com/...",
        "fileName": "receipt.jpg",
        "uploadedAt": "2024-01-16T12:35:00.000Z"
      }
    ]
  }
}
```

---

### Update Expense

**PUT** `/expenses/:id`
🔒 **Authentication Required**

**Request Body:**

```json
{
  "amount": 48.5,
  "note": "Lunch + tip"
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "65exp001...",
    "amount": 48.5,
    "note": "Lunch + tip",
    "updatedAt": "2024-01-16T13:00:00.000Z"
  }
}
```

---

### Delete Expense

**DELETE** `/expenses/:id`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {}
}
```

**Note:** All associated photos are also deleted

---

## 5️⃣ Photo Endpoints

### Upload Bill Photo

**POST** `/photos/upload/:expenseId`
🔒 **Authentication Required**
📎 **Content-Type:** multipart/form-data

**Form Data:**

- `photo`: File (JPEG, PNG, GIF, or PDF - max 10MB)

**Example using cURL:**

```bash
curl -X POST \
  http://localhost:5000/api/photos/upload/65exp001... \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'photo=@/path/to/receipt.jpg'
```

**Response:** (201 Created)

```json
{
  "success": true,
  "data": {
    "_id": "65photo01...",
    "expenseId": "65exp001...",
    "accountId": "65def456...",
    "fileUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/accounting-app/bills/abc123.jpg",
    "publicId": "accounting-app/bills/abc123",
    "fileName": "receipt.jpg",
    "fileSize": 245678,
    "mimeType": "image/jpeg",
    "uploadedBy": "65abc123...",
    "createdAt": "2024-01-16T12:35:00.000Z"
  }
}
```

---

### Get Photos for Expense

**GET** `/photos/expense/:expenseId`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65photo01...",
      "fileUrl": "https://res.cloudinary.com/.../receipt1.jpg",
      "fileName": "receipt1.jpg",
      "fileSize": 245678,
      "createdAt": "2024-01-16T12:35:00.000Z"
    },
    {
      "_id": "65photo02...",
      "fileUrl": "https://res.cloudinary.com/.../receipt2.jpg",
      "fileName": "receipt2.jpg",
      "fileSize": 189234,
      "createdAt": "2024-01-16T12:36:00.000Z"
    }
  ]
}
```

---

### Delete Photo

**DELETE** `/photos/:id`
🔒 **Authentication Required**

**Response:** (200 OK)

```json
{
  "success": true,
  "data": {}
}
```

**Note:** Photo is deleted from both Cloudinary and database

---

## 🔧 Error Responses

All errors follow this format:

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Email is required, Password is required"
}
```

### Authentication Error (401 Unauthorized)

```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Not Found Error (404 Not Found)

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Server Error",
  "stack": "Error stack trace (development only)"
}
```

---

## 📊 Common Workflows

### Complete User Setup Flow

1. **Register** → Get token
2. **Create Account** → Get accountId
3. **Create Categories** (optional - defaults are created)
4. **Create People** → Add users who make expenses
5. **Create Week** → Get weekId
6. **Add Expenses** → Track spending
7. **Upload Photos** → Attach receipts
8. **Lock Week** → Finalize the week

### Example Postman Collection Order

```
1. POST /api/auth/register
2. POST /api/auth/login (save token)
3. GET /api/auth/me (verify)
4. POST /api/accounts (create "Personal")
5. GET /api/accounts/:id/categories (see defaults)
6. POST /api/accounts/:id/people (add "John")
7. POST /api/weeks (create week)
8. POST /api/expenses (add expense)
9. POST /api/photos/upload/:expenseId (upload receipt)
10. PUT /api/weeks/:id/lock (lock the week)
```

---

## 💡 Tips

1. **Save the JWT token** after login - you'll need it for all protected routes
2. **Account IDs** are needed for creating weeks, categories, and people
3. **Week IDs** are needed when creating expenses
4. **Locked weeks** cannot be modified or deleted
5. **Photo uploads** use multipart/form-data, not JSON
6. **Date format**: ISO 8601 format (YYYY-MM-DD or full ISO string)
7. **IDs** are MongoDB ObjectIDs (24 hex characters)

---

**Happy coding! 🚀**
