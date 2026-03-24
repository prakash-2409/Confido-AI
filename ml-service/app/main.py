from fastapi import FastAPI, HTTPException
from app.models.schemas import (
    ResumeRequest, 
    ATSAnalysisResponse, 
    HealthResponse,
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewSummaryRequest,
    InterviewSummaryResponse,
    ResumeSuggestionsRequest,
    ResumeSuggestionsResponse
)
from app.models.ats import ats_analyzer
from app.models.interview_evaluator import interview_evaluator
from app.models.llm_service import (
    is_llm_available, 
    enhance_answer_evaluation, 
    enhance_interview_summary,
    generate_resume_suggestions
)
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Career AI - ML Service",
    description="Microservice for ATS Scoring, Resume Analysis, Interview Evaluation, and LLM-Enhanced Feedback",
    version="2.0.0"
)

@app.get("/", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy", 
        "version": "2.0.0",
        "llm_available": is_llm_available()
    }

# ============================================================
# Resume Analysis Endpoints
# ============================================================

@app.post("/analyze", response_model=ATSAnalysisResponse)
async def analyze_resume(request: ResumeRequest):
    try:
        if not request.resume_text or not request.job_description:
            raise HTTPException(status_code=400, detail="Resume text and Job Description are required")
            
        result = ats_analyzer.analyze(request.resume_text, request.job_description)
        
        # Enhance with LLM suggestions if available
        suggestions = None
        if is_llm_available():
            try:
                suggestions = generate_resume_suggestions(
                    resume_text=request.resume_text,
                    job_description=request.job_description,
                    ats_score=result.get("score", 0),
                    matched_keywords=result.get("matched_keywords", []),
                    missing_keywords=result.get("missing_keywords", [])
                )
            except Exception as e:
                logger.warning(f"LLM resume suggestions failed: {e}")
        
        result["suggestions"] = suggestions
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
        
        # Enhance with LLM if available
        enhanced_feedback = None
        if is_llm_available():
            try:
                llm_result = enhance_answer_evaluation(
                    question_text=request.question_text,
                    category=request.category,
                    answer_text=request.answer_text,
                    expected_keywords=request.expected_keywords,
                    job_role=request.job_role or "",
                    job_description=request.job_description or "",
                    base_evaluation=result
                )
                if llm_result:
                    # Blend LLM score with NLP score (60% NLP, 40% LLM)
                    blended_score = round(result["score"] * 0.6 + llm_result["score"] * 0.4, 2)
                    result["score"] = blended_score
                    result["feedback"] = llm_result.get("feedback", result["feedback"])
                    result["strengths"] = llm_result.get("strengths", result["strengths"])
                    result["improvements"] = llm_result.get("improvements", result["improvements"])
                    enhanced_feedback = llm_result.get("enhanced_feedback")
            except Exception as e:
                logger.warning(f"LLM answer enhancement failed: {e}")
        
        return InterviewAnswerResponse(
            score=result["score"],
            feedback=result["feedback"],
            strengths=result["strengths"],
            improvements=result["improvements"],
            keywords_found=result["keywords_found"],
            keywords_missed=result["keywords_missed"],
            enhanced_feedback=enhanced_feedback
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
        
        # Enhance with LLM if available
        interview_tips = None
        if is_llm_available():
            try:
                llm_summary = enhance_interview_summary(
                    job_role=request.job_role,
                    job_description=request.job_description or "",
                    answers=request.answers,
                    base_summary=result
                )
                if llm_summary:
                    result["feedback_summary"] = llm_summary.get("feedback_summary", result["feedback_summary"])
                    result["recommendations"] = llm_summary.get("recommendations", result["recommendations"])
                    interview_tips = llm_summary.get("interview_tips")
            except Exception as e:
                logger.warning(f"LLM summary enhancement failed: {e}")
        
        return InterviewSummaryResponse(
            overall_score=result["overall_score"],
            readiness_level=result["readiness_level"],
            strong_areas=result["strong_areas"],
            weak_areas=result["weak_areas"],
            category_scores=result["category_scores"],
            recommendations=result["recommendations"],
            feedback_summary=result["feedback_summary"],
            interview_tips=interview_tips
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation error: {str(e)}")


# ============================================================
# Resume Suggestions Endpoint (LLM-powered)
# ============================================================

@app.post("/resume/suggestions", response_model=ResumeSuggestionsResponse)
async def get_resume_suggestions(request: ResumeSuggestionsRequest):
    """
    Generate AI-powered resume improvement suggestions.
    Requires LLM to be configured.
    """
    try:
        if not is_llm_available():
            raise HTTPException(
                status_code=503, 
                detail="LLM service not configured. Set OPENAI_API_KEY or GEMINI_API_KEY."
            )
        
        result = generate_resume_suggestions(
            resume_text=request.resume_text,
            job_description=request.job_description,
            ats_score=request.ats_score,
            matched_keywords=request.matched_keywords,
            missing_keywords=request.missing_keywords
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to generate suggestions")
        
        return ResumeSuggestionsResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestions error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
