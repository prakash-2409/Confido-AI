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
