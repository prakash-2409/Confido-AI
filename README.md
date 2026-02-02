# Career AI SaaS - Backend API

Production-grade Node.js backend for AI Interview & Career Intelligence SaaS platform.

## 🏗️ Architecture

This backend follows **service-based architecture**:
- **Backend API** (this service) - Handles business logic, data persistence, authentication
- **ML Service** (Python/FastAPI) - Handles AI/ML inference (ATS scoring, interview evaluation)
- **Frontend** (React) - User interface

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access + refresh tokens)
- **Security**: Helmet, CORS
- **File Upload**: Multer
- **Logging**: Morgan
- **Validation**: Express-validator

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.js       # Environment variables
│   │   └── database.js  # MongoDB connection
│   ├── middlewares/     # Express middlewares
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── routes/          # Route definitions
│   │   └── health.routes.js
│   ├── controllers/     # Request handlers
│   │   └── health.controller.js
│   ├── models/          # Mongoose schemas
│   ├── modules/         # Feature modules (auth, resume, interview)
│   ├── utils/           # Helper functions
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── package.json
├── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or cloud)

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_ACCESS_SECRET` - Secret key for access tokens
   - `JWT_REFRESH_SECRET` - Secret key for refresh tokens
   - Other optional configurations

4. **Start MongoDB** (if running locally)
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or start your local MongoDB service
   sudo systemctl start mongod
   ```

5. **Run the application**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## 📡 API Endpoints

### Health Check

#### `GET /health`
Basic service health check

**Response:**
```json
{
  "success": true,
  "message": "Career AI SaaS Backend is running",
  "data": {
    "status": "healthy",
    "uptime": 123.456,
    "timestamp": "2026-01-25T14:00:00.000Z",
    "environment": "development",
    "version": "1.0.0"
  }
} 
```

#### `GET /health/db`
Database connectivity check

**Response:**
```json
{
  "success": true,
  "message": "Database is healthy",
  "data": {
    "status": "healthy",
    "database": "career-ai-saas",
    "connected": true,
    "responseTime": "5ms"
  }
}
```

### Implemented Features
- `POST /api/v1/resume/upload` - Upload resume for analysis
- `POST /api/v1/interview/start` - Start interview session
- `POST /api/v1/interview/:id/answer` - Submit and evaluate answer
- `POST /api/v1/interview/:id/complete` - Complete with summary

### Authentication Endpoints

#### `POST /api/v1/auth/register`
Register a new user

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "name": "John Doe",
      "profileCompleteness": 30
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": "15m"
    }
  }
}
```

#### `POST /api/v1/auth/login`
Login existing user

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):** Same as register

#### `GET /api/v1/auth/me`
Get current user profile (requires authentication)

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "name": "John Doe",
      "currentRole": "Software Engineer",
      "targetRole": "Senior Engineer",
      "experienceYears": 3,
      "profileCompleteness": 50,
      "hasUploadedResume": false
    }
  }
}
```

#### `PUT /api/v1/auth/profile`
Update user profile (requires authentication)

**Request:**
```json
{
  "name": "John Smith",
  "currentRole": "Software Engineer",
  "targetRole": "Senior Software Engineer",
  "experienceYears": 3,
  "phone": "+1234567890"
}
```

#### `POST /api/v1/auth/refresh`
Refresh access token

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": "15m"
    }
  }
}
```

#### `POST /api/v1/auth/logout`
Logout user (invalidate refresh token)

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

### Resume Endpoints

#### `POST /api/v1/resume/upload`
Upload and parse resume (PDF/DOCX)

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:**
- `resume`: File object

**Response (201):**
```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "...",
      "fileName": "my_cv.pdf",
      "textLength": 1250,
      "status": "uploaded"
    }
  }
}
```

#### `GET /api/v1/resume`
List all uploaded resumes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 2,
    "resumes": [...]
  }
}
```

### Analysis Endpoints

#### `POST /api/v1/resume/:id/analyze`
Analyze resume against job description

**Body:**
```json
{
  "jobDescription": "We are looking for..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "score": 85.5,
    "matchedKeywords": ["python", "fastapi"],
    "missingKeywords": ["docker"],
    "summary": null
  }
}
```

### Interview Endpoints

#### `POST /api/v1/interview/start`
Start new interview session

**Body:**
```json
{
  "jobRole": "Senior Full Stack Developer",
  "jobDescription": "Looking for a developer with JavaScript, React, Node.js experience...",
  "resumeId": "optional-resume-id"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Interview session started successfully",
  "data": {
    "interviewId": "...",
    "jobRole": "Senior Full Stack Developer",
    "totalQuestions": 8,
    "extractedSkills": ["javascript", "react", "nodejs"],
    "currentQuestion": {...},
    "questions": [...]
  }
}
```

#### `GET /api/v1/interview/:id`
Get interview session details

**Response (200):**
```json
{
  "success": true,
  "data": {
    "interviewId": "...",
    "status": "in_progress",
    "progress": 37,
    "questions": [...],
    "answers": [...],
    "nextQuestion": {...}
  }
}
```

#### `GET /api/v1/interview/history`
Get user's interview history with pagination

**Query params:** `status`, `limit`, `page`

#### `POST /api/v1/interview/:id/answer`
Submit answer for evaluation

**Body:**
```json
{
  "questionId": "q-123...",
  "answerText": "Detailed answer here..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "score": 85,
      "feedback": "Excellent answer!",
      "strengths": ["Includes specific examples"],
      "improvements": ["Add more metrics"]
    },
    "progress": {...},
    "hasMoreQuestions": true,
    "nextQuestion": {...}
  }
}
```

#### `POST /api/v1/interview/:id/complete`
Complete interview and get summary

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "overallScore": 78,
      "readinessLevel": "Medium",
      "strongAreas": ["Technical questions"],
      "weakAreas": ["Behavioral questions"],
      "categoryScores": {...},
      "recommendations": [...]
    }
  }
}
```

See [INTERVIEW_TESTING.md](backend/INTERVIEW_TESTING.md) for full API documentation.

## 🛡️ Security Features

- **Helmet**: Secure HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **JWT**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password encryption
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: Protection against brute force attacks

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/career-ai-saas |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `ML_SERVICE_URL` | ML service endpoint | http://localhost:8000 |

## 🧪 Testing

```bash
# Run tests (to be added)
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## 📝 Development Guidelines

1. **Modular Architecture**: Keep features in separate modules
2. **Error Handling**: Always use try-catch and proper error responses
3. **Validation**: Validate all user inputs
4. **Logging**: Log important events and errors
5. **Security**: Never commit secrets, use environment variables
6. **Documentation**: Comment complex logic, update README

## 🔄 Request/Response Flow

```
Request → Middleware Stack → Route → Controller → Service → Database
                                                      ↓
Response ← Error Handler ← Controller ← Service ← Database
```

1. **Middleware Stack**: Logger, Helmet, CORS, Body Parser
2. **Route**: Matches URL pattern to controller
3. **Controller**: Handles request, calls services
4. **Service**: Business logic (to be added)
5. **Database**: Data persistence via Mongoose
6. **Error Handler**: Catches and formats all errors

## 🐳 Docker Support

Coming in Step 7 (DevOps)

## 📚 Next Steps

- [x] Step 1: Backend Foundation ✅
- [x] Step 2: Authentication System ✅
- [x] Step 3: Resume Intelligence (Upload, parsing, ML integration) ✅
- [x] Step 4: ML Service (ATS scoring, skill extraction) ✅
- [x] Step 5: Interview Intelligence (Questions, evaluation, summary) ✅
- [ ] Step 6: Frontend (React + Tailwind)
- [ ] Step 7: DevOps (Docker, Nginx, deployment)

## 🤝 Contributing

This is a production-grade SaaS project, not a college mini project. Code quality matters!

## 📄 License

MIT
