"""
Dynamic Question Generator

Generates interview questions based on round type and context.
- Round 1: Introduction (pre-defined)
- Round 2: Resume Deep Dive (LLM-generated from resume context)
- Round 3: Technical/DSA (adaptive difficulty from question bank)
- Round 4: Behavioral (STAR method questions)
"""

import logging
import json
import random
from typing import Dict, List, Optional
from app.models.llm_service import call_llm

logger = logging.getLogger(__name__)

# ============================================================
# Round 1: Introduction Questions
# ============================================================

ROUND_1_QUESTIONS = [
    {
        "question_text": "Tell me about yourself and your background.",
        "category": "introduction",
        "difficulty": "easy",
        "expected_keywords": ["background", "education", "experience", "skills"],
        "evaluation_criteria": {
            "clarity": 0.4,
            "confidence": 0.3,
            "structure": 0.3
        }
    },
    {
        "question_text": "Walk me through your resume and highlight your key achievements.",
        "category": "introduction",
        "difficulty": "easy",
        "expected_keywords": ["projects", "achievements", "experience", "technologies"],
        "evaluation_criteria": {
            "clarity": 0.4,
            "confidence": 0.3,
            "structure": 0.3
        }
    }
]

# ============================================================
# Round 4: Behavioral Questions (STAR method)
# ============================================================

BEHAVIORAL_QUESTIONS = [
    {
        "question_text": "Tell me about a time you failed at something. How did you handle it?",
        "category": "behavioral",
        "difficulty": "medium",
        "expected_keywords": ["situation", "task", "action", "result", "learned", "failure"],
        "evaluation_criteria": {
            "star_method": 0.4,
            "self_awareness": 0.3,
            "culture_fit": 0.3
        }
    },
    {
        "question_text": "Describe a situation where you had a conflict with a team member. How did you resolve it?",
        "category": "behavioral",
        "difficulty": "medium",
        "expected_keywords": ["conflict", "communication", "resolution", "teamwork", "compromise"],
        "evaluation_criteria": {
            "star_method": 0.4,
            "self_awareness": 0.3,
            "culture_fit": 0.3
        }
    },
    {
        "question_text": "Why should we hire you? What makes you stand out from other candidates?",
        "category": "behavioral",
        "difficulty": "medium",
        "expected_keywords": ["skills", "experience", "value", "unique", "contribution"],
        "evaluation_criteria": {
            "star_method": 0.3,
            "self_awareness": 0.4,
            "culture_fit": 0.3
        }
    },
    {
        "question_text": "Tell me about a time you had to work under pressure or meet a tight deadline.",
        "category": "behavioral",
        "difficulty": "medium",
        "expected_keywords": ["pressure", "deadline", "prioritization", "time management", "result"],
        "evaluation_criteria": {
            "star_method": 0.4,
            "self_awareness": 0.3,
            "culture_fit": 0.3
        }
    }
]


def generate_round_1_question(question_index: int = 0) -> Dict:
    """
    Generate Round 1 (Introduction) question

    Args:
        question_index: Index of question (0 or 1)

    Returns:
        Dict with question details
    """
    if question_index >= len(ROUND_1_QUESTIONS):
        question_index = len(ROUND_1_QUESTIONS) - 1

    return ROUND_1_QUESTIONS[question_index]


def generate_round_2_question(
    resume_context: Dict,
    conversation_history: List[Dict],
    job_role: str,
    job_description: str = ""
) -> Optional[Dict]:
    """
    Generate Round 2 (Resume Deep Dive) question using LLM

    Creates personalized questions based on candidate's projects and technologies

    Args:
        resume_context: Extracted resume context (projects, skills, achievements)
        conversation_history: Previous Q&As in this round
        job_role: Target job role
        job_description: Job description text

    Returns:
        Dict with question details, or None if generation fails
    """
    try:
        # Build context from resume
        projects_str = "\n".join([
            f"- {p['name']}: {p['description']} (Tech: {', '.join(p['technologies'])})"
            for p in resume_context.get("projects", [])[:3]
        ])

        skills_str = ", ".join(resume_context.get("skills", [])[:15])

        # Build conversation history
        previous_questions = [qa.get("question_text", "") for qa in conversation_history]
        previous_questions_str = "\n".join([f"- {q}" for q in previous_questions]) if previous_questions else "None"

        # LLM Prompt
        system_prompt = """You are an expert technical interviewer conducting a Resume Deep Dive round.
Your goal is to probe the candidate's hands-on experience and technical decision-making.
Generate questions that cannot be answered with generic knowledge - they must test actual project experience."""

        user_prompt = f"""You are interviewing a candidate for a {job_role} position.

CANDIDATE'S RESUME:
Projects:
{projects_str if projects_str else "No projects found"}

Skills: {skills_str if skills_str else "No skills found"}

QUESTIONS ALREADY ASKED IN THIS ROUND:
{previous_questions_str}

Generate ONE probing question that:
1. Focuses on a specific project or technology they mentioned
2. Tests hands-on experience, not theoretical knowledge
3. Asks "Why" or "How" about their technical decisions
4. Digs deeper than surface-level understanding
5. Is different from questions already asked

Examples of good questions:
- "Why did you choose React over Angular for your e-commerce project?"
- "How did you handle state management in your chat application?"
- "What was the biggest technical challenge in your food delivery system and how did you solve it?"
- "Explain your decision to use microservices architecture in your project."

Return ONLY the question text, no explanation or preamble."""

        # Call LLM
        question_text = call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=200,
            temperature=0.7
        )

        if not question_text or len(question_text.strip()) < 10:
            logger.warning("LLM returned empty or too short question for Round 2")
            return None

        # Extract relevant keywords from resume for evaluation
        expected_keywords = []
        for project in resume_context.get("projects", [])[:2]:
            expected_keywords.extend(project.get("technologies", [])[:3])
        expected_keywords.extend(resume_context.get("skills", [])[:5])

        return {
            "question_text": question_text.strip(),
            "category": "technical",
            "difficulty": "medium",
            "expected_keywords": list(set(expected_keywords))[:10],  # Remove duplicates, limit to 10
            "evaluation_criteria": {
                "depth_of_knowledge": 0.4,
                "technical_understanding": 0.3,
                "problem_solving": 0.3
            },
            "generated_from": "llm"
        }

    except Exception as e:
        logger.error(f"Error generating Round 2 question: {str(e)}")
        return None


def generate_round_3_question(
    question_bank: List[Dict],
    difficulty: str = "medium",
    previous_scores: List[float] = None
) -> Optional[Dict]:
    """
    Generate Round 3 (Technical/DSA) question from question bank

    Adaptive difficulty based on previous performance

    Args:
        question_bank: List of DSA problems
        difficulty: Desired difficulty (easy/medium/hard)
        previous_scores: Previous answer scores for adaptive difficulty

    Returns:
        Dict with question details
    """
    try:
        # Determine adaptive difficulty based on previous scores
        if previous_scores and len(previous_scores) > 0:
            avg_score = sum(previous_scores) / len(previous_scores)

            if avg_score >= 75:
                difficulty = "hard"
            elif avg_score >= 50:
                difficulty = "medium"
            else:
                difficulty = "easy"

        # Filter questions by difficulty
        filtered_questions = [q for q in question_bank if q.get("difficulty") == difficulty]

        if not filtered_questions:
            # Fallback to medium if no questions found
            filtered_questions = [q for q in question_bank if q.get("difficulty") == "medium"]

        if not filtered_questions:
            logger.warning("No questions found in question bank")
            return None

        # Randomly select a question
        question = random.choice(filtered_questions)

        return {
            "question_text": question.get("question_text"),
            "category": "technical",
            "difficulty": question.get("difficulty"),
            "expected_keywords": question.get("expected_keywords", []),
            "problem_constraints": question.get("constraints", ""),
            "examples": question.get("examples", []),
            "evaluation_criteria": {
                "approach": 0.5,
                "correctness": 0.3,
                "optimization": 0.2
            }
        }

    except Exception as e:
        logger.error(f"Error generating Round 3 question: {str(e)}")
        return None


def generate_round_4_question(
    conversation_history: List[Dict]
) -> Dict:
    """
    Generate Round 4 (Behavioral) question

    Args:
        conversation_history: Previous Q&As in this round

    Returns:
        Dict with question details
    """
    # Get questions not yet asked
    asked_questions = [qa.get("question_text", "") for qa in conversation_history]

    available_questions = [
        q for q in BEHAVIORAL_QUESTIONS
        if q["question_text"] not in asked_questions
    ]

    if not available_questions:
        # If all questions asked, allow repeats
        available_questions = BEHAVIORAL_QUESTIONS

    # Randomly select
    return random.choice(available_questions)


def generate_question(
    round_number: int,
    job_role: str,
    job_description: str = "",
    resume_context: Dict = None,
    conversation_history: List[Dict] = None,
    question_bank: List[Dict] = None,
    question_index: int = 0,
    previous_scores: List[float] = None
) -> Optional[Dict]:
    """
    Main function to generate question based on round

    Args:
        round_number: Current round (1-4)
        job_role: Target job role
        job_description: Job description text
        resume_context: Resume context (for Round 2)
        conversation_history: Previous Q&As in current round
        question_bank: DSA problems (for Round 3)
        question_index: Question index (for Round 1)
        previous_scores: Previous answer scores (for adaptive difficulty)

    Returns:
        Dict with question details
    """
    conversation_history = conversation_history or []

    if round_number == 1:
        return generate_round_1_question(question_index)

    elif round_number == 2:
        if not resume_context:
            logger.warning("No resume context provided for Round 2")
            return None
        return generate_round_2_question(
            resume_context=resume_context,
            conversation_history=conversation_history,
            job_role=job_role,
            job_description=job_description
        )

    elif round_number == 3:
        if not question_bank:
            logger.warning("No question bank provided for Round 3")
            return None
        return generate_round_3_question(
            question_bank=question_bank,
            difficulty="medium",
            previous_scores=previous_scores
        )

    elif round_number == 4:
        return generate_round_4_question(conversation_history)

    else:
        logger.error(f"Invalid round number: {round_number}")
        return None
