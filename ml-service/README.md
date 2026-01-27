# ML Service - Technical Documentation

## 🧠 Overview

The **ML Service** is a separate microservice built with **FastAPI (Python)**. It provides AI/ML capabilities to the main SaaS backend.

**Tech Stack:**
- **FastAPI**: High-performance Python web framework
- **scikit-learn**: Machine learning library for TF-IDF and Cosine Similarity
- **NLTK**: Natural Language Toolkit for tokenization and keyword extraction
- **Docker**: Containerization

---

## 🏗️ Architecture

```
Node.js Backend (Express)
       │
       │ POST /analyze
       │ { resume_text, job_description }
       ▼
ML Service (FastAPI)
       │
       ├── 1. Text Cleaning (Regex, Lowercase)
       │
       ├── 2. Extraction (NLTK)
       │      • Tokenize
       │      • Remove Stopwords
       │      • Get Top Keywords
       │
       ├── 3. Scoring (scikit-learn)
       │      • TF-IDF Vectorization
       │      • Cosine Similarity calculation
       │
       ▼
Returns JSON:
{
  "score": 85.5,
  "missing_keywords": ["react", "nodejs"],
  "matched_keywords": ["javascript", "html"]
}
```

---

## 🧮 How Scoring Works (The "Secret Sauce")

### 1. TF-IDF (Term Frequency-Inverse Document Frequency)
We convert both the Resume and the Job Description into mathematical vectors.
- **TF**: How often a word appears in the document.
- **IDF**: How rare the word is across documents (lowers weight of common words like "the", "and").

### 2. Cosine Similarity
We calculate the cosine of the angle between the two vectors.
- **Angle = 0°** → Cosine = 1 (Identical documents)
- **Angle = 90°** → Cosine = 0 (Completely different)

**Why this approach?**
It's more robust than simple keyword counting. If a job description emphasizes "Python" 5 times, a resume mentioning it once gets some credit, but one mentioning it 3 times gets more credit, without over-rewarding keyword stuffing.

---

## 🧪 Testing the ML Service

### Using Docker (Recommended)

```bash
cd ml-service
docker build -t career-ai-ml-service .
docker run -p 8000:8000 career-ai-ml-service
```

### Endpoints

#### `GET /` - Health Check
Returns `{"status": "healthy"}`

#### `POST /analyze` - Analyze Resume
**Body:**
```json
{
  "resume_text": "I am a software engineer with 5 years of experience in Python and FastAPI...",
  "job_description": "We are looking for a Senior Software Engineer with strong Python skills..."
}
```

**Response:**
```json
{
  "score": 75.5,
  "missing_keywords": ["senior", "leadership"],
  "matched_keywords": ["software", "engineer", "python"],
  "summary": null
}
```

---

## 🚀 Future Improvements

1. **Transformer Models (BERT/RoBERTa)**: Move beyond TF-IDF to understand semantic meaning (e.g., knowing that "JS" and "JavaScript" are the same).
2. **Named Entity Recognition (NER)**: Use Spacy to specifically extract "Skills", "Companies", and "Job Titles".
3. **Deep Learning**: Train a custom model on thousands of successful resume/job pairs using PyTorch.
