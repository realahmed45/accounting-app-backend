# Weekly Accounting App - Backend API

A RESTful API for managing weekly accounting, expenses, and bill photos with multi-account support.

## 🚀 Features

- 🔐 **Authentication**: JWT-based user authentication
- 👤 **User Management**: User registration, login, and profile updates
- 📊 **Multi-Account Support**: One user can manage multiple accounts (personal, business, projects)
- 📅 **Weekly Management**: Create and manage accounting weeks with lock functionality
- 💰 **Expense Tracking**: Track expenses with categories, people, and notes
- 📸 **Bill Photos**: Upload and manage bill photos via Cloudinary
- 🔒 **Week Locking**: Lock weeks to prevent modifications
- 📈 **Cash Flow Management**: Track bank and cash box balances

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Cloud Storage**: Cloudinary
- **CORS**: Express CORS middleware

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB database (local or cloud - MongoDB Atlas recommended)
- Cloudinary account for photo uploads

## ⚙️ Installation

1. **Navigate to backend directory**:

```bash
cd backend
```

2. **Install dependencies**:

```bash
npm install
```

3. **Create environment file**:

```bash
cp .env.example .env
```

4. **Configure environment variables** in `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/accounting-app
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🏃 Running the Server

### Development Mode (with auto-restart):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint                   | Description         | Auth Required |
| ------ | -------------------------- | ------------------- | ------------- |
| POST   | `/api/auth/register`       | Register new user   | ❌            |
| POST   | `/api/auth/login`          | Login user          | ❌            |
| GET    | `/api/auth/me`             | Get current user    | ✅            |
| PUT    | `/api/auth/updatedetails`  | Update user details | ✅            |
| PUT    | `/api/auth/updatepassword` | Update password     | ✅            |

### Account Routes (`/api/accounts`)

| Method | Endpoint                       | Description            | Auth Required |
| ------ | ------------------------------ | ---------------------- | ------------- |
| GET    | `/api/accounts`                | Get all user accounts  | ✅            |
| POST   | `/api/accounts`                | Create new account     | ✅            |
| GET    | `/api/accounts/:id`            | Get single account     | ✅            |
| PUT    | `/api/accounts/:id`            | Update account         | ✅            |
| DELETE | `/api/accounts/:id`            | Delete account         | ✅            |
| GET    | `/api/accounts/:id/categories` | Get account categories | ✅            |
| POST   | `/api/accounts/:id/categories` | Create category        | ✅            |
| GET    | `/api/accounts/:id/people`     | Get account people     | ✅            |
| POST   | `/api/accounts/:id/people`     | Create person          | ✅            |

### Week Routes (`/api/weeks`)

| Method | Endpoint                        | Description               | Auth Required |
| ------ | ------------------------------- | ------------------------- | ------------- |
| POST   | `/api/weeks`                    | Create new week           | ✅            |
| GET    | `/api/weeks/account/:accountId` | Get all weeks for account | ✅            |
| GET    | `/api/weeks/:id`                | Get single week           | ✅            |
| PUT    | `/api/weeks/:id`                | Update week               | ✅            |
| PUT    | `/api/weeks/:id/lock`           | Lock week                 | ✅            |
| DELETE | `/api/weeks/:id`                | Delete week               | ✅            |

### Expense Routes (`/api/expenses`)

| Method | Endpoint                           | Description             | Auth Required |
| ------ | ---------------------------------- | ----------------------- | ------------- |
| POST   | `/api/expenses`                    | Create new expense      | ✅            |
| GET    | `/api/expenses/week/:weekId`       | Get expenses by week    | ✅            |
| GET    | `/api/expenses/account/:accountId` | Get expenses by account | ✅            |
| GET    | `/api/expenses/:id`                | Get single expense      | ✅            |
| PUT    | `/api/expenses/:id`                | Update expense          | ✅            |
| DELETE | `/api/expenses/:id`                | Delete expense          | ✅            |

### Photo Routes (`/api/photos`)

| Method | Endpoint                         | Description            | Auth Required |
| ------ | -------------------------------- | ---------------------- | ------------- |
| POST   | `/api/photos/upload/:expenseId`  | Upload bill photo      | ✅            |
| GET    | `/api/photos/expense/:expenseId` | Get photos for expense | ✅            |
| DELETE | `/api/photos/:id`                | Delete photo           | ✅            |

## 📝 Request/Response Examples

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "middleName": "M",
  "familyName": "Doe",
  "phoneNumber": "+1234567890"
}
```

### Create Account

```bash
POST /api/accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountName": "Personal Expenses",
  "currency": "USD",
  "timezone": "America/New_York"
}
```

### Create Expense

```bash
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountId": "account_id_here",
  "weekId": "week_id_here",
  "date": "2024-01-15",
  "amount": 45.99,
  "category": "Food & Dining",
  "person": "John",
  "note": "Lunch at restaurant",
  "fromBank": true
}
```

### Upload Bill Photo

```bash
POST /api/photos/upload/:expenseId
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <file>
```

## 🔒 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The token is returned upon successful login/registration and expires based on `JWT_EXPIRE` setting.

## 🗄️ Database Models

### User

- email, password, firstName, middleName, familyName, phoneNumber
- Password automatically hashed before saving
- Supports password comparison method

### Account

- accountName, userId, currency, timezone
- One user can have multiple accounts

### Week

- accountId, startDate, endDate, isLocked, bankBalance, cashBoxBalance
- Can be locked to prevent further modifications

### Expense

- accountId, weekId, date, amount, category, person, note, fromBank
- Linked to specific week and account

### Category

- accountId, name, isDefault
- Custom categories per account

### Person

- accountId, name, isCashFlowManager, pinCode
- People who make expenses in the account

### BillPhoto

- expenseId, accountId, fileUrl, publicId, fileName, uploadedBy
- Stored in Cloudinary

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Protected routes middleware
- CORS configuration
- Input validation
- Error handling middleware

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── cloudinary.js     # Cloudinary configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── accountController.js
│   │   ├── weekController.js
│   │   ├── expenseController.js
│   │   └── photoController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   ├── errorHandler.js   # Global error handler
│   │   └── upload.js         # Multer configuration
│   ├── models/
│   │   ├── User.js
│   │   ├── Account.js
│   │   ├── Week.js
│   │   ├── Expense.js
│   │   ├── Category.js
│   │   ├── Person.js
│   │   ├── BillPhoto.js
│   │   └── CashFlowCheck.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── accounts.js
│   │   ├── weeks.js
│   │   ├── expenses.js
│   │   └── photos.js
│   ├── app.js                # Express app setup
│   └── server.js             # Server entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing the API

You can test the API using:

- **Postman**: Import the endpoints and test
- **Thunder Client**: VS Code extension
- **cURL**: Command line testing

Health check endpoint:

```bash
GET http://localhost:5000/health
```

## 🐛 Error Handling

All errors are handled by the global error handler middleware and return:

```json
{
  "success": false,
  "message": "Error description",
  "stack": "Stack trace (development only)"
}
```

## 📦 Dependencies

### Production

- express - Web framework
- mongoose - MongoDB ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- cors - CORS middleware
- dotenv - Environment variables
- multer - File upload handling
- cloudinary - Cloud storage
- streamifier - Stream conversion for uploads
- express-validator - Input validation

### Development

- nodemon - Auto-restart on file changes

## 🚀 Deployment

### Environment Variables

Ensure all environment variables are set in production:

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET` (min 32 characters)
- Configure MongoDB Atlas connection string
- Set up Cloudinary production credentials

### Recommended Platforms

- **Railway**: Easy deployment with MongoDB
- **Render**: Free tier available
- **Heroku**: Classic choice
- **DigitalOcean**: VPS deployment
- **AWS/Azure**: Enterprise deployment

## 📄 License

MIT

## 👥 Support

For issues or questions, please create an issue in the repository.
