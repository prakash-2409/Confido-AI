# Step 3: Resume Intelligence - Technical Explanation

## 🎯 What We Built

A robust **Resume Parsing & Management System** that allows users to:
1. Upload PDF or DOCX resumes securely.
2. Automatically extract text content from binary files.
3. Validate file types and sizes.
4. Store resume metadata and extracted text in MongoDB.
5. Manage their resume portfolio (List/Delete).

This module serves as the **Data Ingestion Layer** for our AI services. Without clean text extraction, we cannot perform ATS scoring or Skill Gap Analysis.

---

## 🏗️ Architecture & Flow

### 1. Upload & Parsing Flow

```
User (Client)
   │
   ├─ POST /upload (multipart/form-data) ──┐
   │                                       │
   ▼                                       ▼
[Middleware: Auth]                  [Middleware: Upload]
   │ Validates Token                       │ Uses Multer
   │ Attaches req.user                     │ Checks File Type (PDF/DOCX)
   │                                       │ Checks Size (<5MB)
   │                                       │ Saves to /uploads disk
   └───────────────────┬───────────────────┘
                       │
                       ▼
               [ResumeController]
                       │
           ┌───────────┴───────────┐
           │                       │
 [Util: parseResume]      [FS: File System]
           │                       │
    Check MimeType                 │
  ┌────────┴────────┐              │
  ▼                 ▼              │
[pdf-parse]     [mammoth]          │
  │ (Buffer)        │ (Buffer)     │
  └───┬─────────────┘              │
      │ Clean Text                 │
      ▼                            │
 [MongoDB: Create] ◄───────────────┘
      │
      └─ Return Response 201
```

---

## 🧩 Key Components

### 1. `Resume` Model (`src/models/Resume.js`)
- Stores metadata: `originalName`, `fileSize`, `mimeType`.
- Stores **Extracted Text**: Critical for AI processing.
- Stores **Status**: `uploaded`, `analyzing`, `analyzed`.
- Has `atsScore` and `skills` fields (populated later by ML service).
- Linked to `User` via ObjectId.

### 2. upload Middleware (`src/middlewares/upload.js`)
- Uses `multer` for handling `multipart/form-data`.
- **Validation**:
  - `fileFilter`: Rejects non-PDF/DOCX files immediately.
  - `limits`: Enforces 5MB max size to prevent DoS.
- **Storage**:
  - Renames files with timestamp to avoid collisions (`resume-170123456.pdf`).

### 3. Parsing Utility (`src/utils/resumeParser.js`)
- **Strategy Pattern** based on file type:
  - **PDF**: Uses `pdf-parse`. Reads raw buffer and extracts text strings.
  - **DOCX**: Uses `mammoth`. Extracts raw text, ignoring complex formatting which can confuse NLP models.
- **Text Cleaning**:
  - Removes null bytes (`\0`).
  - Normalizes line breaks.
  - Collapses multiple spaces.
  - **Why?** LLMs and NLP libraries perform better with clean, normalized text.

---

## 🔐 Security Considerations

1. **File Type Validation**:
   We check `file.mimetype` in Multer. This prevents users from uploading `.exe` or scripts.

2. **File Size Limits**:
   Capped at 5MB. Large files can crash the server (memory exhaustion) or fill up disk space.

3. **Ownership Checks**:
   - `getResumeById` and `deleteResume` verify that `resume.user === req.user._id`.
   - Prevents User A from deleting User B's resume.

4. **Resource Cleanup**:
   - If parsing fails, we explicitly `fs.unlinkSync` the uploaded file to prevent "ghost files" from eating storage.
   - When deleting a resume entry, we also delete the physical file.

---

## 🎓 Interview Talking Points

### "How do you handle file uploads in Node.js?"
> "I use `multer` middleware to handle `multipart/form-data`. I configure it with disk storage to keep memory usage low, but for production at scale, I would stream files directly to cloud storage like AWS S3 to keep the backend stateless."

### "How do you prepare resumes for AI analysis?"
> "AI models need text, not binary files. I implemented a parsing layer using `pdf-parse` for PDFs and `mammoth` for DOCX files. I strip out formatting and images to get raw text, then normalize whitespace. This 'clean text' is stored in the database and sent to the ML service."

### "What happens if a user uploads a scanned image PDF?"
> "Standard PDF parsers extract text layers. If a PDF is just an image (scanned), `pdf-parse` returns empty text. I added a check: if extracted text length < 50 chars, I reject the upload and inform the user to upload a text-based resume or use OCR (which would be a future enhancement)."

---

## 🚀 Next Steps

Now that we have the text, **Step 4** is building the **ML Service (FastAPI)** to:
1. Receive this text.
2. Calculate TF-IDF / Cosine Similarity against Job Descriptions.
3. Extract Skills (Named Entity Recognition).
4. Return an ATS Score.
