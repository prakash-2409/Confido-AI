"""
Resume Context Extractor - LLM-powered

Extracts structured information from resume text for Round 2 (Resume Deep Dive) personalization
Uses LLM to parse projects, technologies, and achievements from unstructured resume text
"""

import logging
import json
from typing import Dict, List, Optional
from app.models.llm_service import call_llm

logger = logging.getLogger(__name__)


def extract_resume_context(resume_text: str) -> Dict:
    """
    Extract structured context from resume using LLM

    Args:
        resume_text (str): Unstructured text extracted from resume PDF/DOCX

    Returns:
        dict: {
            "projects": [{"name": str, "technologies": [str], "description": str}],
            "skills": [str],
            "achievements": [str]
        }
    """
    try:
        # Truncate resume text if too long (keep first 3000 chars)
        resume_text_truncated = resume_text[:3000] if len(resume_text) > 3000 else resume_text

        logger.info(f"Extracting resume context from {len(resume_text)} characters")

        # Build LLM prompt
        system_prompt = """You are an expert resume parser. Extract structured information from the provided resume text.
Focus on identifying concrete projects, technical skills, and measurable achievements.
Always respond in valid JSON format with no additional text."""

        user_prompt = f"""Extract the following information from this resume:

Resume Text:
{resume_text_truncated}

Return JSON with this exact structure:
{{
  "projects": [
    {{
      "name": "Project Name",
      "technologies": ["Tech1", "Tech2"],
      "description": "Brief description of the project (1-2 sentences)"
    }}
  ],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "achievements": ["Achievement 1 with metrics", "Achievement 2 with impact"]
}}

Instructions:
1. Extract 2-5 projects (focus on most significant ones)
2. For each project, identify the key technologies used
3. List 5-15 technical skills (programming languages, frameworks, tools)
4. Extract 2-5 achievements that include metrics or measurable impact
5. If information is not present, return empty arrays
6. Keep descriptions concise (under 150 characters)

Return ONLY the JSON object, no markdown formatting or additional text."""

        # Call LLM
        llm_response = call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=1200,
            temperature=0.3  # Lower temperature for more consistent extraction
        )

        if not llm_response:
            logger.warning("LLM returned empty response for resume context extraction")
            return _get_fallback_context()

        # Parse JSON response
        try:
            # Clean response (remove markdown code blocks if present)
            cleaned_response = llm_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]

            context = json.loads(cleaned_response.strip())

            # Validate structure
            if not isinstance(context, dict):
                raise ValueError("Response is not a dictionary")

            # Ensure required keys exist
            context.setdefault("projects", [])
            context.setdefault("skills", [])
            context.setdefault("achievements", [])

            # Validate and clean projects
            projects = []
            for project in context.get("projects", []):
                if isinstance(project, dict) and "name" in project:
                    projects.append({
                        "name": str(project.get("name", "Untitled Project"))[:100],
                        "technologies": [str(t)[:50] for t in project.get("technologies", [])[:10]],
                        "description": str(project.get("description", ""))[:200]
                    })
            context["projects"] = projects[:5]  # Limit to 5 projects

            # Validate and clean skills (limit to 20)
            skills = [str(s)[:50] for s in context.get("skills", []) if isinstance(s, str)]
            context["skills"] = skills[:20]

            # Validate and clean achievements (limit to 5)
            achievements = [str(a)[:200] for a in context.get("achievements", []) if isinstance(a, str)]
            context["achievements"] = achievements[:5]

            logger.info(f"Successfully extracted: {len(context['projects'])} projects, {len(context['skills'])} skills, {len(context['achievements'])} achievements")

            return context

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.debug(f"LLM response was: {llm_response[:200]}")
            return _get_fallback_context()

    except Exception as e:
        logger.error(f"Error extracting resume context: {str(e)}")
        return _get_fallback_context()


def _get_fallback_context() -> Dict:
    """
    Return empty context structure when extraction fails
    """
    return {
        "projects": [],
        "skills": [],
        "achievements": []
    }


def has_sufficient_context(context: Dict) -> bool:
    """
    Check if extracted context has enough information for Round 2

    Args:
        context (dict): Extracted resume context

    Returns:
        bool: True if context has at least 2 skills or 1 project
    """
    return (
        (isinstance(context.get("skills"), list) and len(context["skills"]) >= 2) or
        (isinstance(context.get("projects"), list) and len(context["projects"]) >= 1)
    )
