"""
LLM Service Integration

Provides enhanced interview feedback and resume suggestions using LLMs.
Supports OpenAI (GPT-4o-mini) and Google Gemini.
Falls back to rule-based evaluation if LLM is unavailable.
"""

import os
import json
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# LLM Provider configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")  # openai or gemini
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# Try importing LLM libraries
openai_client = None
genai = None

try:
    if OPENAI_API_KEY:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized")
except ImportError:
    logger.warning("OpenAI library not installed. Install with: pip install openai")
except Exception as e:
    logger.warning(f"Failed to initialize OpenAI client: {e}")

try:
    if GEMINI_API_KEY:
        import google.generativeai as google_genai
        google_genai.configure(api_key=GEMINI_API_KEY)
        genai = google_genai
        logger.info("Gemini client initialized")
except ImportError:
    logger.warning("Google GenAI library not installed. Install with: pip install google-generativeai")
except Exception as e:
    logger.warning(f"Failed to initialize Gemini client: {e}")


def is_llm_available() -> bool:
    """Check if any LLM provider is configured and available"""
    if LLM_PROVIDER == "openai" and openai_client and OPENAI_API_KEY:
        return True
    if LLM_PROVIDER == "gemini" and genai and GEMINI_API_KEY:
        return True
    return False


def _call_openai(system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> Optional[str]:
    """Call OpenAI API"""
    try:
        response = openai_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return None


def _call_gemini(system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> Optional[str]:
    """Call Google Gemini API"""
    try:
        model = genai.GenerativeModel(
            model_name=LLM_MODEL if "gemini" in LLM_MODEL else "gemini-1.5-flash",
            system_instruction=system_prompt,
        )
        response = model.generate_content(
            user_prompt,
            generation_config=genai.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.7,
            )
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return None


def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> Optional[str]:
    """Call the configured LLM provider"""
    if LLM_PROVIDER == "openai" and openai_client:
        return _call_openai(system_prompt, user_prompt, max_tokens)
    elif LLM_PROVIDER == "gemini" and genai:
        return _call_gemini(system_prompt, user_prompt, max_tokens)
    return None


def _parse_json_response(text: str) -> Optional[Dict]:
    """Extract and parse JSON from LLM response"""
    try:
        # Try direct parse
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON in markdown code blocks
    try:
        import re
        json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
    except (json.JSONDecodeError, AttributeError):
        pass
    
    # Try to find JSON object in text
    try:
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except (json.JSONDecodeError, AttributeError):
        pass
    
    return None


def enhance_answer_evaluation(
    question_text: str,
    category: str,
    answer_text: str,
    expected_keywords: List[str],
    job_role: str = "",
    job_description: str = "",
    base_evaluation: Dict = None
) -> Optional[Dict]:
    """
    Use LLM to enhance interview answer evaluation with more nuanced feedback.
    Returns enhanced evaluation or None if LLM is unavailable.
    """
    if not is_llm_available():
        return None
    
    system_prompt = """You are an expert interview coach evaluating candidate responses. 
Provide constructive, specific, and actionable feedback. 
Always respond in valid JSON format with no additional text."""

    base_score = base_evaluation.get("score", 0) if base_evaluation else 0
    
    user_prompt = f"""Evaluate this interview answer:

**Job Role**: {job_role or 'Not specified'}
**Question Category**: {category}
**Question**: {question_text}
**Candidate Answer**: {answer_text}
**Expected Keywords**: {', '.join(expected_keywords) if expected_keywords else 'None specified'}
**Baseline NLP Score**: {base_score}/100

Provide evaluation in this exact JSON format:
{{
    "score": <number 0-100, consider the baseline but use your judgment>,
    "feedback": "<2-3 sentence overall assessment>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
    "enhanced_feedback": "<detailed paragraph with specific coaching advice>"
}}"""

    response = call_llm(system_prompt, user_prompt, max_tokens=800)
    if not response:
        return None
    
    parsed = _parse_json_response(response)
    if not parsed:
        return None
    
    # Validate and sanitize
    try:
        return {
            "score": max(0, min(100, float(parsed.get("score", base_score)))),
            "feedback": str(parsed.get("feedback", "")),
            "strengths": list(parsed.get("strengths", []))[:5],
            "improvements": list(parsed.get("improvements", []))[:5],
            "enhanced_feedback": str(parsed.get("enhanced_feedback", "")),
        }
    except (TypeError, ValueError):
        return None


def enhance_interview_summary(
    job_role: str,
    job_description: str,
    answers: List[Dict],
    base_summary: Dict = None
) -> Optional[Dict]:
    """
    Use LLM to generate enhanced interview summary with personalized insights.
    Returns enhanced summary or None if LLM is unavailable.
    """
    if not is_llm_available():
        return None
    
    system_prompt = """You are an expert career coach analyzing interview performance. 
Provide insightful, personalized, and actionable career advice.
Always respond in valid JSON format with no additional text."""

    # Build answer summary for context
    answer_summaries = []
    for i, ans in enumerate(answers):
        answer_summaries.append(
            f"Q{i+1} ({ans.get('category', 'unknown')}): Score {ans.get('score', 0)}/100"
        )
    
    base_score = base_summary.get("overall_score", 0) if base_summary else 0
    
    user_prompt = f"""Generate a comprehensive interview performance summary:

**Job Role**: {job_role}
**Job Description**: {job_description[:500] if job_description else 'Not provided'}
**Baseline Overall Score**: {base_score}/100

**Answer Performance**:
{chr(10).join(answer_summaries)}

Provide summary in this exact JSON format:
{{
    "overall_score": <number 0-100>,
    "readiness_level": "<High/Medium/Low>",
    "strong_areas": ["<area 1>", "<area 2>"],
    "weak_areas": ["<area 1>", "<area 2>"],
    "recommendations": ["<specific recommendation 1>", "<specific recommendation 2>", "<specific recommendation 3>"],
    "feedback_summary": "<detailed 3-4 sentence personalized career coaching paragraph>",
    "interview_tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}}"""

    response = call_llm(system_prompt, user_prompt, max_tokens=1000)
    if not response:
        return None
    
    parsed = _parse_json_response(response)
    if not parsed:
        return None
    
    try:
        return {
            "overall_score": max(0, min(100, float(parsed.get("overall_score", base_score)))),
            "readiness_level": str(parsed.get("readiness_level", "Medium")),
            "strong_areas": list(parsed.get("strong_areas", []))[:5],
            "weak_areas": list(parsed.get("weak_areas", []))[:5],
            "recommendations": list(parsed.get("recommendations", []))[:5],
            "feedback_summary": str(parsed.get("feedback_summary", "")),
            "interview_tips": list(parsed.get("interview_tips", []))[:5],
        }
    except (TypeError, ValueError):
        return None


def generate_resume_suggestions(
    resume_text: str,
    job_description: str,
    ats_score: float,
    matched_keywords: List[str],
    missing_keywords: List[str]
) -> Optional[Dict]:
    """
    Use LLM to generate actionable resume improvement suggestions.
    Returns suggestions or None if LLM is unavailable.
    """
    if not is_llm_available():
        return None
    
    system_prompt = """You are an expert resume consultant and ATS optimization specialist.
Provide specific, actionable resume improvement advice.
Always respond in valid JSON format with no additional text."""

    user_prompt = f"""Analyze this resume against the job description and provide improvement suggestions:

**ATS Score**: {ats_score}/100
**Matched Keywords**: {', '.join(matched_keywords[:20])}
**Missing Keywords**: {', '.join(missing_keywords[:20])}

**Resume Text** (first 1500 chars):
{resume_text[:1500]}

**Job Description** (first 1000 chars):
{job_description[:1000]}

Provide suggestions in this exact JSON format:
{{
    "overall_assessment": "<2-3 sentence overview>",
    "score_interpretation": "<what the ATS score means for this candidate>",
    "content_suggestions": [
        {{"section": "<section name>", "suggestion": "<specific improvement>", "priority": "high|medium|low"}},
        {{"section": "<section name>", "suggestion": "<specific improvement>", "priority": "high|medium|low"}}
    ],
    "keyword_integration": [
        {{"keyword": "<missing keyword>", "suggestion": "<how to naturally incorporate>"}},
        {{"keyword": "<missing keyword>", "suggestion": "<how to naturally incorporate>"}}
    ],
    "formatting_tips": ["<tip 1>", "<tip 2>"],
    "action_items": ["<prioritized action 1>", "<prioritized action 2>", "<prioritized action 3>"]
}}"""

    response = call_llm(system_prompt, user_prompt, max_tokens=1200)
    if not response:
        return None
    
    parsed = _parse_json_response(response)
    if not parsed:
        return None
    
    try:
        return {
            "overall_assessment": str(parsed.get("overall_assessment", "")),
            "score_interpretation": str(parsed.get("score_interpretation", "")),
            "content_suggestions": list(parsed.get("content_suggestions", []))[:8],
            "keyword_integration": list(parsed.get("keyword_integration", []))[:6],
            "formatting_tips": list(parsed.get("formatting_tips", []))[:5],
            "action_items": list(parsed.get("action_items", []))[:5],
        }
    except (TypeError, ValueError):
        return None
