from fastapi import FastAPI, HTTPException
from app.models.schemas import (
    ResumeRequest, 
    ATSAnalysisResponse, 
    HealthResponse,
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewSummaryRequest,
    InterviewSummaryResponse
)
from app.models.ats import ats_analyzer
from app.models.interview_evaluator import interview_evaluator
import uvicorn

app = FastAPI(
    title="Career AI - ML Service",
    description="Microservice for ATS Scoring, Resume Analysis, and Interview Evaluation",
    version="1.1.0"
)

@app.get("/", response_model=HealthResponse)
async def health_check():
    return {"status": "healthy", "version": "1.1.0"}

# ============================================================
# Resume Analysis Endpoints
# ============================================================

@app.post("/analyze", response_model=ATSAnalysisResponse)
async def analyze_resume(request: ResumeRequest):
    try:
        if not request.resume_text or not request.job_description:
            raise HTTPException(status_code=400, detail="Resume text and Job Description are required")
            
        result = ats_analyzer.analyze(request.resume_text, request.job_description)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Interview Evaluation Endpoints
# ============================================================

@app.post("/interview/evaluate", response_model=InterviewAnswerResponse)
async def evaluate_interview_answer(request: InterviewAnswerRequest):
    """
    Evaluate a single interview answer
    
    Evaluates based on:
    - Keyword coverage
    - Answer length and structure
    - Relevance to question
    - Category-specific criteria (STAR method for behavioral, etc.)
    """
    try:
        if not request.question_text or not request.answer_text:
            raise HTTPException(
                status_code=400, 
                detail="Question text and answer text are required"
            )
        
        if not request.category:
            raise HTTPException(
                status_code=400,
                detail="Question category is required (behavioral, technical, situational)"
            )
        
        result = interview_evaluator.evaluate_answer(
            question_text=request.question_text,
            category=request.category,
            answer_text=request.answer_text,
            expected_keywords=request.expected_keywords,
            job_role=request.job_role,
            job_description=request.job_description
        )
        
        return InterviewAnswerResponse(
            score=result["score"],
            feedback=result["feedback"],
            strengths=result["strengths"],
            improvements=result["improvements"],
            keywords_found=result["keywords_found"],
            keywords_missed=result["keywords_missed"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation error: {str(e)}")


@app.post("/interview/summary", response_model=InterviewSummaryResponse)
async def generate_interview_summary(request: InterviewSummaryRequest):
    """
    Generate comprehensive interview summary after session completion
    
    Returns:
    - Overall score
    - Readiness level (Low/Medium/High)
    - Strong and weak areas
    - Category-wise scores
    - Recommendations for improvement
    """
    try:
        if not request.job_role:
            raise HTTPException(status_code=400, detail="Job role is required")
        
        if not request.answers:
            raise HTTPException(status_code=400, detail="At least one answer is required")
        
        result = interview_evaluator.generate_summary(
            job_role=request.job_role,
            job_description=request.job_description or "",
            answers=request.answers
        )
        
        return InterviewSummaryResponse(
            overall_score=result["overall_score"],
            readiness_level=result["readiness_level"],
            strong_areas=result["strong_areas"],
            weak_areas=result["weak_areas"],
            category_scores=result["category_scores"],
            recommendations=result["recommendations"],
            feedback_summary=result["feedback_summary"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
