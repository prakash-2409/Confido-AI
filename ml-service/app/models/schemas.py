from pydantic import BaseModel
from typing import List, Optional, Dict

class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str

class ATSAnalysisResponse(BaseModel):
    score: float
    missing_keywords: List[str]
    matched_keywords: List[str]
    summary: Optional[str] = None
    suggestions: Optional[Dict] = None  # LLM-powered resume suggestions

class HealthResponse(BaseModel):
    status: str
    version: str
    llm_available: Optional[bool] = None

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
    enhanced_feedback: Optional[str] = None  # LLM-enhanced coaching

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
    interview_tips: Optional[List[str]] = None  # LLM-enhanced tips

# ============================================================
# Resume Suggestions Schema
# ============================================================

class ResumeSuggestionsRequest(BaseModel):
    """Request schema for LLM-powered resume suggestions"""
    resume_text: str
    job_description: str
    ats_score: float
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []

class ResumeSuggestionsResponse(BaseModel):
    """Response schema for resume improvement suggestions"""
    overall_assessment: str
    score_interpretation: str
    content_suggestions: List[Dict] = []
    keyword_integration: List[Dict] = []
    formatting_tips: List[str] = []
    action_items: List[str] = []
