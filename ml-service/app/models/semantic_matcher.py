import numpy as np
import logging
from typing import Dict, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.llm_service import call_llm, is_llm_available

logger = logging.getLogger(__name__)

# Dictionary mapping common technologies to their broader semantic categories
SEMANTIC_SYNONYMS = {
    'fastapi': ['rest apis', 'backend development', 'web services', 'apis'],
    'express': ['rest apis', 'node.js', 'backend development', 'apis'],
    'django': ['python', 'backend development', 'mvc architecture'],
    'react': ['frontend development', 'user interfaces', 'javascript framework', 'spa'],
    'vue': ['frontend development', 'user interfaces', 'javascript framework'],
    'docker': ['containerization', 'devops', 'deployment', 'microservices'],
    'kubernetes': ['container orchestration', 'devops', 'deployment', 'microservices'],
    'aws': ['cloud computing', 'cloud infrastructure', 'amazon web services'],
    'gcp': ['cloud computing', 'cloud infrastructure', 'google cloud'],
    'postgresql': ['databases', 'relational databases', 'sql'],
    'mongodb': ['databases', 'nosql', 'document databases'],
    'scikit-learn': ['machine learning', 'artificial intelligence', 'data science', 'predictive modeling'],
    'pytorch': ['deep learning', 'machine learning', 'artificial intelligence', 'neural networks'],
    'tensorflow': ['deep learning', 'machine learning', 'artificial intelligence', 'neural networks'],
    'langchain': ['llms', 'generative ai', 'artificial intelligence', 'ai agents']
}

def calculate_semantic_similarity(resume_text: str, job_description: str, skills: List[str]) -> Dict:
    """
    Computes exact and semantic similarity between a candidate resume profile and a job description.
    Uses TF-IDF + Cosine Similarity locally and maps synonym overlaps.
    """
    try:
        # Standardize strings
        r_text = resume_text.lower()
        jd_text = job_description.lower()

        # 1. Exact match calculations
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([r_text, jd_text])
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        exact_match_pct = round(float(cosine_sim) * 100, 1)

        # 2. Semantic synonym mapping
        detected_hidden_skills = []
        alternative_skills = {}
        
        # Check every synonym mapping
        for tech, categories in SEMANTIC_SYNONYMS.items():
            # If candidate has the tech
            has_tech = any(s.lower() == tech or tech in s.lower() for s in skills)
            if has_tech:
                for cat in categories:
                    # If JD requires the broader category
                    if cat in jd_text:
                        detected_hidden_skills.append(f"Mapped candidate '{tech}' to JD requirement '{cat}'")
                        alternative_skills[cat] = tech

        # 3. Compute semantic overlay score
        semantic_boost = len(alternative_skills) * 4
        semantic_match_pct = min(100.0, exact_match_pct + semantic_boost + 15) # Default baseline boost for semantic connections

        # 4. If LLM is available, refine with deep cognitive semantic comparison
        if is_llm_available():
            try:
                refined_scores = _refine_similarity_with_llm(resume_text, job_description)
                if refined_scores:
                    exact_match_pct = refined_scores.get('exact_match', exact_match_pct)
                    semantic_match_pct = refined_scores.get('semantic_match', semantic_match_pct)
                    detected_hidden_skills.extend(refined_scores.get('hidden_skills', []))
            except Exception as ex:
                logger.warn(f"LLM semantic similarity refinement failed: {ex}")

        # Final sanitization
        return {
            "semantic_match_pct": float(min(100.0, max(0.0, semantic_match_pct))),
            "exact_match_pct": float(min(100.0, max(0.0, exact_match_pct))),
            "hidden_skills": list(set(detected_hidden_skills))[:5],
            "alternative_skills": alternative_skills
        }

    except Exception as e:
        logger.error(f"Semantic similarity matching error: {e}")
        return {
            "semantic_match_pct": 50.0,
            "exact_match_pct": 40.0,
            "hidden_skills": ["Fallbacked due to internal vector calculation error"],
            "alternative_skills": {}
        }

def _refine_similarity_with_llm(resume_text: str, job_description: str) -> Dict:
    """Uses LLM to grade semantic matching overlay between resume and JD"""
    system_prompt = "You are a professional recruiting analyzer. Compare the candidate profile against the JD requirements."
    user_prompt = f"""Compare this candidate resume and job description.
Resume:
{resume_text[:2000]}

Job Description:
{job_description[:2000]}

Evaluate semantic similarity. If the JD requires 'REST APIs' and the candidate lists 'FastAPI', that's a semantic match.
Return JSON matching this format:
{{
  "exact_match": 65.0,
  "semantic_match": 82.0,
  "hidden_skills": [
    "Matched FastAPI to REST APIs requirement",
    "Matched Docker to Deployment requirement"
  ]
}}
Respond ONLY in valid raw JSON."""

    response = call_llm(system_prompt, user_prompt, max_tokens=300, temperature=0.1)
    if response:
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        import json
        return json.loads(cleaned.strip())
    return None
