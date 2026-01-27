# Step 4: ML Service Integration - Testing Guide

## 🎯 Test Workflow

1. **Start ML Service** (Port 8000)
2. **Start Backend** (Port 5000)
3. **Upload Resume** (Get ID)
4. **Analyze Resume** (Trigger Analysis)

## 1. Start ML Service

```bash
cd ml-service
docker build -t career-ai-ml-service .
docker run -d -p 8000:8000 --name ml-service career-ai-ml-service
```

## 2. Start Backend

```bash
cd backend
npm run dev
```

## 3. Trigger Analysis

Use the Resume ID you got from uploading a resume (Step 3).

```bash
# Analyze Resume
curl -X POST http://localhost:5000/api/v1/resume/<RESUME_ID>/analyze \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "We are looking for a Software Engineer with experience in React, Node.js, and MongoDB. Must have cloud experience."
  }' | jq
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "score": 85.5,
    "matchedKeywords": ["react", "node.js", "mongodb", "software", "engineer"],
    "missingKeywords": ["cloud"],
    "summary": null
  }
}
```

## ⚠️ Common Errors

### ML Service Unavailable (503)
```json
{ "success": false, "error": { "message": "ML Service is unavailable..." } }
```
**Fix:** Check if Docker container is running (`docker ps`).

### Invalid Input (400)
If Job Description is too short (<50 chars).
