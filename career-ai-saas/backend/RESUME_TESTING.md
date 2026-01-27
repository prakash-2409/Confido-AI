# Resume Intelligence - Testing Guide

## 🎯 Available Endpoints

All resume endpoints are prefixed with `/api/v1/resume` and **require authentication**.

### 1. Upload Resume
**Method:** `POST`  
**Endpoint:** `/api/v1/resume/upload`  
**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: multipart/form-data`
**Body:** form-data with key `resume` containing the file (PDF or DOCX)

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Resume uploaded and processed successfully",
  "data": {
    "resume": {
      "id": "65a...",
      "fileName": "my_resume.pdf",
      "uploadedAt": "2026-01-26T10:00:00.000Z",
      "status": "uploaded",
      "textLength": 1500,
      "preview": "John Doe\nSoftware Engineer..."
    }
  }
}
```

### 2. List My Resumes
**Method:** `GET`  
**Endpoint:** `/api/v1/resume`  
**Headers:** `Authorization: Bearer <accessToken>`

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 1,
    "resumes": [
      {
        "_id": "65a...",
        "originalName": "my_resume.pdf",
        "createdAt": "..."
      }
    ]
  }
}
```

### 3. Get Resume Details
**Method:** `GET`  
**Endpoint:** `/api/v1/resume/:id`  
**Headers:** `Authorization: Bearer <accessToken>`

### 4. Delete Resume
**Method:** `DELETE`  
**Endpoint:** `/api/v1/resume/:id`  
**Headers:** `Authorization: Bearer <accessToken>`

## 🧪 Testing with cURL

### Prerequisites
1. You must be logged in. Run the login command from `AUTH_TESTING.md` and save the `ACCESS_TOKEN`.
2. Prepare a sample PDF or DOCX file named `sample_resume.pdf`.

```bash
# 1. Upload Resume
curl -X POST http://localhost:5000/api/v1/resume/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "resume=@./sample_resume.pdf" | jq

# Extract Resume ID from response
# RESUME_ID=...

# 2. List Resumes
curl -X GET http://localhost:5000/api/v1/resume \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 3. Get Details
curl -X GET http://localhost:5000/api/v1/resume/$RESUME_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 4. Delete Resume
curl -X DELETE http://localhost:5000/api/v1/resume/$RESUME_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## ⚠️ Common Errors

### File Too Large (400)
If file > 5MB:
```json
{ "success": false, "error": { "message": "File too large" } }
```

### Invalid File Type (400)
If uploading .txt or .png:
```json
{ "success": false, "error": { "message": "Invalid file type. Only PDF and DOCX are allowed." } }
```

### No Text Found (400)
If uploading a scanned PDF (image-only):
```json
{ "success": false, "error": { "message": "Could not extract enough text..." } }
```
