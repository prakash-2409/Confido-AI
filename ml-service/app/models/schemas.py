from pydantic import BaseModel
from typing import List, Optional

class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str

class ATSAnalysisResponse(BaseModel):
    score: float
    missing_keywords: List[str]
    matched_keywords: List[str]
    summary: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str

# ============================================================
# Interview Evaluation Schemas
# ============================================================

class InterviewAnswerRequest(BaseModel):
    """Request schema for evaluating a single interview answer"""
    question_text: str
    category: str  # behavioral, technical, situational
    answer_text: str
    expected_keywords: List[str] = []
    job_role: Optional[str] = None
    job_description: Optional[str] = None

class InterviewAnswerResponse(BaseModel):
    """Response schema for interview answer evaluation"""
    score: float  # 0-100
    feedback: str
    strengths: List[str]
    improvements: List[str]
    keywords_found: List[str]
    keywords_missed: List[str]

class InterviewSummaryRequest(BaseModel):
    """Request schema for generating interview summary"""
    job_role: str
    job_description: str
    answers: List[dict]  # List of { category, score, strengths, improvements }

class InterviewSummaryResponse(BaseModel):
    """Response schema for interview summary"""
    overall_score: float
    readiness_level: str  # Low, Medium, High
    strong_areas: List[str]
    weak_areas: List[str]
    category_scores: dict  # { behavioral: X, technical: Y, situational: Z }
    recommendations: List[str]
    feedback_summary: str
