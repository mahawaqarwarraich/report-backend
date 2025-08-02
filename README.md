# 🕌 Islamic Report Management System - Backend

A robust Node.js/Express.js backend API for managing Islamic daily religious activities and monthly reports.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [PDF Generation](#-pdf-generation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Daily Reports**: Track daily religious activities (Namaz, Hifz, Nazra, Tafseer, Hadees)
- **Monthly Reports**: Comprehensive monthly activity summaries
- **Q&A System**: Monthly reflection questions and answers
- **PDF Generation**: Generate professional PDF reports for submission
- **Data Validation**: Comprehensive input validation using express-validator
- **Mobile Responsive API**: Optimized for mobile and desktop clients
- **Security**: CORS protection, input sanitization, and secure headers

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **Environment**: dotenv

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd islamic-report-app/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see Environment Variables section)

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/islamic-reports
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/islamic-reports

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# CORS Configuration (for production)
FRONTEND_URL=http://localhost:3000
```

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/islamic-reports` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `JWT_EXPIRE` | JWT token expiration | `7d` |

## 📡 API Endpoints

### Authentication Endpoints

#### `POST /api/users/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### `POST /api/users/login`
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### `GET /api/users/profile`
Get user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Report Endpoints

#### `GET /api/reports/current`
Get current month's report.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "report": {
    "_id": "report-id",
    "user": "user-id",
    "month": "January",
    "year": 2024,
    "days": [...],
    "qa": {...}
  }
}
```

#### `POST /api/reports/add-day`
Add or update a day's activities.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "date": 15,
  "month": "January",
  "year": 2024,
  "namaz": "yes",
  "hifz": "no",
  "nazra": "yes",
  "tafseer": "no",
  "hadees": "yes",
  "karkunaan": 5,
  "mulkaat": 3,
  "amoomi_afraad": 10,
  "mulakat": 2,
  "khatoot_tadad": 8
}
```

#### `POST /api/reports/add-answers`
Save monthly Q&A responses.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "month": "January",
  "year": 2024,
  "answers": {
    "q1": "Answer to question 1",
    "q2": "Answer to question 2",
    ...
    "q28": "Answer to question 28"
  }
}
```

#### `GET /api/reports/pdf/:month/:year`
Generate and download PDF report.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** PDF file download

## 🗄️ Database Schema

### User Schema
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Report Schema
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required),
  month: String (required),
  year: Number (required),
  days: [{
    date: Number (1-31),
    month: String,
    year: Number,
    namaz: String (enum: ['yes', 'no']),
    hifz: String (enum: ['yes', 'no']),
    nazra: String (enum: ['yes', 'no']),
    tafseer: String (enum: ['yes', 'no']),
    hadees: String (enum: ['yes', 'no']),
    karkunaan: Number,
    mulkaat: Number,
    amoomi_afraad: Number,
    mulakat: Number,
    khatoot_tadad: Number
  }],
  qa: Object (Q&A responses)
}
```

### Database Indexes
- **Users Collection**: Email field has unique index
- **Reports Collection**: Compound unique index on (user, month, year)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Token Generation**: Tokens are generated on login/register
2. **Token Validation**: Middleware validates tokens on protected routes
3. **Token Expiration**: Tokens expire after 7 days (configurable)
4. **Password Security**: Passwords are hashed using bcryptjs

### Protected Routes
All report endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## 📄 PDF Generation

The backend generates comprehensive PDF reports using PDFKit:

### PDF Features
- **Professional Layout**: A4 format with proper margins
- **User Information**: Name, month, and year
- **Activity Table**: Daily activities in tabular format
- **Q&A Section**: Monthly questions and answers
- **Statistics**: Completion rates and summaries

### PDF Structure
1. Header with user information
2. Monthly activity table (1-31 days)
3. Q&A responses (28 questions)
4. Professional formatting for submission

## 💻 Development

### Available Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run tests
npm test
```

### Project Structure
```
backend/
├── models/          # Mongoose schemas
│   ├── User.js
│   └── Report.js
├── routes/          # API routes
│   ├── users.js
│   └── reports.js
├── middleware/      # Custom middleware
│   └── auth.js
├── server.js        # Main server file
├── package.json
└── README.md
```

### Code Style
- Use ES6+ features
- Follow Express.js best practices
- Implement proper error handling
- Use async/await for database operations
- Validate all inputs

## 🧪 Testing

### Manual Testing
Use the provided test script:
```bash
node test-app.js
```

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Test registration
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🚀 Deployment

### Production Deployment

1. **Set Environment Variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   ```

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Start Server**
   ```bash
   npm start
   ```

### Deployment Platforms

#### Render
- Use the provided `render.yaml` configuration
- Set environment variables in Render dashboard
- Automatic deployment from GitHub

#### Railway
- Use the provided `railway.json` configuration
- Set environment variables in Railway dashboard
- Deploy using Railway CLI

#### Heroku
- Use the provided `Procfile`
- Set environment variables using Heroku CLI
- Deploy using `git push heroku main`

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
**Error**: `MongoServerError: Authentication failed`
**Solution**: Check MongoDB URI and credentials

#### 2. JWT Token Issues
**Error**: `JsonWebTokenError: invalid token`
**Solution**: Ensure JWT_SECRET is set correctly

#### 3. CORS Errors
**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
**Solution**: Update CORS configuration in server.js

#### 4. PDF Generation Fails
**Error**: `PDF generation failed`
**Solution**: Check if PDFKit is properly installed

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=app:*
```

### Logs
Check server logs for detailed error information:
```bash
npm run dev
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Test with the provided test script
4. Check server logs for error details

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ for the Islamic community** 