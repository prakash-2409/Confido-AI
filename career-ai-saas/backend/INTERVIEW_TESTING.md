# Interview Intelligence - Testing Guide

## 🎯 Endpoints

All endpoints prefixed with `/api/v1/interview`

### 1. Start Interview Session
**POST** `/api/v1/interview/start`
Body:
```json
{
  "resumeId": "65a...",
  "jobTitle": "Frontend Engineer",
  "jobDescription": "Looking for React developer..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interviewId": "65b...",
    "questions": [
      { "id": "q1", "text": "What is Virtual DOM?", "category": "technical" },
      ...
    ]
  }
}
```

### 2. Submit Answer
**POST** `/api/v1/interview/:id/answer`
Body:
```json
{
  "questionId": "q1",
  "answer": "The Virtual DOM is a lightweight copy..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "feedback": "Good answer! You covered key concepts."
  }
}
```

### 3. End Interview
**POST** `/api/v1/interview/:id/end`

**Response:**
```json
{
  "success": true,
  "data": {
    "interview": {
      "status": "completed",
      "overallScore": 82,
      ...
    }
  }
}
```

## 🧪 cURL Commands

```bash
# Start Interview
curl -X POST http://localhost:5000/api/v1/interview/start \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "'$RESUME_ID'",
    "jobTitle": "React Developer",
    "jobDescription": "React, Redux, Node.js"
  }' | jq

# Save Interview ID
# INTERVIEW_ID=...
# QUESTION_ID=...

# Submit Answer
curl -X POST http://localhost:5000/api/v1/interview/$INTERVIEW_ID/answer \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "'$QUESTION_ID'",
    "answer": "React uses a virtual DOM to optimize rendering performance."
  }' | jq
```
