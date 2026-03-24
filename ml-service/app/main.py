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
    ResumeSuggestionsResponse,
    ResumeContextRequest,
    ResumeContextResponse,
    QuestionGenerationRequest,
    QuestionGenerationResponse
)
from app.models.ats import ats_analyzer
from app.models.interview_evaluator import interview_evaluator
from app.models.llm_service import (
    is_llm_available,
    enhance_answer_evaluation,
    enhance_interview_summary,
    generate_resume_suggestions
)
from app.models.resume_context_extractor import extract_resume_context
from app.models import dynamic_question_generator
import uvicorn
import logging
import json
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load question bank for Round 3 (DSA problems)
QUESTION_BANK = []
try:
    question_bank_path = os.path.join(os.path.dirname(__file__), "data", "questionBank.json")
    with open(question_bank_path, "r") as f:
        QUESTION_BANK = json.load(f)
    logger.info(f"Loaded {len(QUESTION_BANK)} questions from question bank")
except FileNotFoundError:
    logger.warning("Question bank file not found. Round 3 questions will not be available.")
except Exception as e:
    logger.error(f"Error loading question bank: {e}")

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


@app.post("/interview/extract-resume-context", response_model=ResumeContextResponse)
async def extract_resume_context_endpoint(request: ResumeContextRequest):
    """
    Extract structured context from resume text using LLM

    For 4-round mock interviews, this extracts:
    - Projects with technologies and descriptions
    - Technical skills
    - Achievements with metrics

    This context is used to generate personalized questions in Round 2 (Resume Deep Dive)
    """
    try:
        if not request.resume_text or len(request.resume_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Resume text is required and must be at least 50 characters"
            )

        if not is_llm_available():
            raise HTTPException(
                status_code=503,
                detail="LLM service not configured. Resume context extraction requires LLM."
            )

        logger.info(f"Extracting context from resume ({len(request.resume_text)} chars)")
        context = extract_resume_context(request.resume_text)

        return ResumeContextResponse(
            projects=context.get("projects", []),
            skills=context.get("skills", []),
            achievements=context.get("achievements", [])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume context extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Context extraction error: {str(e)}")


@app.post("/interview/generate-question", response_model=QuestionGenerationResponse)
async def generate_question_endpoint(request: QuestionGenerationRequest):
    """
    Generate dynamic interview question based on round and context

    Round-specific generation:
    - Round 1 (Introduction): Pre-defined warmup questions
    - Round 2 (Resume Deep Dive): LLM-generated personalized questions from resume
    - Round 3 (Technical/DSA): Adaptive difficulty from question bank
    - Round 4 (Behavioral): STAR method questions

    This enables conversational, context-aware interview flow
    """
    try:
        if request.round_number < 1 or request.round_number > 4:
            raise HTTPException(
                status_code=400,
                detail="Round number must be between 1 and 4"
            )

        if not request.job_role:
            raise HTTPException(
                status_code=400,
                detail="Job role is required"
            )

        # Round 2 requires resume context
        if request.round_number == 2 and not request.resume_context:
            raise HTTPException(
                status_code=400,
                detail="Resume context is required for Round 2 (Resume Deep Dive)"
            )

        # Round 3 requires question bank
        if request.round_number == 3 and not QUESTION_BANK:
            raise HTTPException(
                status_code=503,
                detail="Question bank not loaded. Round 3 questions unavailable."
            )

        logger.info(f"Generating question for Round {request.round_number}, Job Role: {request.job_role}")

        # Generate question using dynamic question generator
        question = dynamic_question_generator.generate_question(
            round_number=request.round_number,
            job_role=request.job_role,
            job_description=request.job_description,
            resume_context=request.resume_context,
            conversation_history=request.conversation_history,
            question_bank=QUESTION_BANK if request.round_number == 3 else None,
            question_index=request.question_index,
            previous_scores=request.previous_scores
        )

        if not question:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate question for Round {request.round_number}"
            )

        return QuestionGenerationResponse(
            question_text=question.get("question_text"),
            category=question.get("category"),
            difficulty=question.get("difficulty"),
            expected_keywords=question.get("expected_keywords", []),
            evaluation_criteria=question.get("evaluation_criteria", {}),
            problem_constraints=question.get("problem_constraints"),
            examples=question.get("examples", []),
            generated_from=question.get("generated_from", "template")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Question generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Question generation error: {str(e)}")


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
