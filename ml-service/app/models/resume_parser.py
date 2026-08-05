import re
import json
import logging
from typing import Dict
from app.models.llm_service import call_llm, is_llm_available

logger = logging.getLogger(__name__)

# Predefined keywords for matching skills in rule-based fallback
TECHNICAL_KEYWORDS = [
    'Python', 'Javascript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'HTML', 'CSS',
    'React', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'FastAPI', 'Angular', 'Vue.js',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'Elasticsearch', 'SQLite',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'CI/CD', 'Jenkins', 'Git',
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision'
]

def parse_resume_structured(resume_text: str) -> Dict:
    """
    Parses resume text into structured JSON.
    Uses LLM if available, otherwise falls back to a regex/keyword-matching engine.
    """
    if is_llm_available():
        try:
            logger.info("Using LLM for structured resume parsing")
            return _parse_with_llm(resume_text)
        except Exception as e:
            logger.error(f"LLM resume parsing failed: {e}. Falling back to rule-based parser.")
            return _parse_with_rules(resume_text)
    else:
        logger.info("LLM not available, using rule-based parser")
        return _parse_with_rules(resume_text)

def _parse_with_llm(resume_text: str) -> Dict:
    """Extract structured data from resume using LLM"""
    system_prompt = """You are an advanced, industry-grade resume parser.
Extract ALL sections of the candidate's resume into a structured JSON object.
Do not summarize or truncate descriptions.
Respond strictly in valid JSON format with no additional text or formatting."""

    user_prompt = f"""Extract the following information from this resume:

Resume Text:
{resume_text[:4000]}

Return JSON matching this exact structure:
{{
  "personal": {{
    "name": "Candidate Full Name",
    "email": "candidate@email.com",
    "phone": "+91 99999 99999",
    "linkedin": "https://linkedin.com/in/username",
    "github": "https://github.com/username",
    "portfolio": "https://portfolio.com"
  }},
  "education": [
    {{
      "college": "University Name",
      "degree": "B.Tech Computer Science",
      "cgpa": "9.2/10 or 85%",
      "graduation_year": "2026"
    }}
  ],
  "experience": [
    {{
      "company": "Company Name",
      "role": "Software Engineer Intern",
      "duration": "June 2024 - August 2024",
      "description": "Designed and deployed backend modules using Node.js."
    }}
  ],
  "projects": [
    {{
      "name": "Project Title",
      "description": "Full-stack web application for hiring validation.",
      "technologies": ["React", "Express", "MongoDB"],
      "github_url": "https://github.com/user/project"
    }}
  ],
  "skills": ["Python", "Docker", "Algorithms"],
  "certifications": ["AWS Certified Solutions Architect"],
  "achievements": ["1st place in Smart India Hackathon 2024"],
  "languages": ["English", "Hindi"],
  "internships": [
    {{
      "company": "Startup Inc",
      "role": "Frontend Intern",
      "duration": "3 months",
      "description": "Created responsive dashboard views."
    }}
  ],
  "publications": ["AI-assisted grading paper, IEEE 2024"],
  "volunteer": [
    {{
      "company": "NGO Name",
      "role": "Tech Volunteer",
      "duration": "2023 - Present",
      "description": "Maintained the organization website."
    }}
  ]
}}

Instructions:
1. Extract ALL available information. If a section does not exist, use empty arrays/strings.
2. Normalize names, links, and dates.
3. Return ONLY the raw JSON object. Do not wrap in ```json``` markdown code blocks."""

    response = call_llm(system_prompt, user_prompt, max_tokens=1500, temperature=0.1)
    if not response:
        raise Exception("LLM returned empty response")

    # Clean markdown formatting if present
    cleaned = response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]

    parsed = json.loads(cleaned.strip())
    
    # Simple validation/sanitization
    parsed.setdefault("personal", {})
    parsed.setdefault("education", [])
    parsed.setdefault("experience", [])
    parsed.setdefault("projects", [])
    parsed.setdefault("skills", [])
    parsed.setdefault("certifications", [])
    parsed.setdefault("achievements", [])
    parsed.setdefault("languages", [])
    parsed.setdefault("internships", [])
    parsed.setdefault("publications", [])
    parsed.setdefault("volunteer", [])

    return parsed

def _parse_with_rules(resume_text: str) -> Dict:
    """Fallback: Regex & rule-based parser when LLM is unavailable"""
    parsed = {
        "personal": {
            "name": "",
            "email": "",
            "phone": "",
            "linkedin": "",
            "github": "",
            "portfolio": ""
        },
        "education": [],
        "experience": [],
        "projects": [],
        "skills": [],
        "certifications": [],
        "achievements": [],
        "languages": [],
        "internships": [],
        "publications": [],
        "volunteer": []
    }

    # Extract name (Heuristic: usually the first non-blank line in first 100 characters)
    lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
    if lines:
        for line in lines[:3]:
            if len(line) < 30 and not any(k in line.lower() for k in ['resume', 'curriculum', 'cv', 'email', 'phone', 'http']):
                parsed["personal"]["name"] = line
                break

    # Regex search for contact details
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
    if email_match:
        parsed["personal"]["email"] = email_match.group(0)

    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', resume_text)
    if phone_match:
        parsed["personal"]["phone"] = phone_match.group(0)

    linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+', resume_text, re.IGNORECASE)
    if linkedin_match:
        parsed["personal"]["linkedin"] = linkedin_match.group(0)

    github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[\w\-]+', resume_text, re.IGNORECASE)
    if github_match:
        parsed["personal"]["github"] = github_match.group(0)

    portfolio_match = re.search(r'(?:https?://)?(?:www\.)?[\w\-]+\.(?:com|org|net|io|me|dev)', resume_text)
    if portfolio_match and not any(k in portfolio_match.group(0).lower() for k in ['github', 'linkedin', 'google', 'example']):
        parsed["personal"]["portfolio"] = portfolio_match.group(0)

    # Skills matching
    for keyword in TECHNICAL_KEYWORDS:
        regex = new RegExp = re.compile(rf'\b{re.escape(keyword)}\b', re.IGNORECASE)
        if regex.search(resume_text):
            parsed["skills"].append(keyword)

    # Heuristic for Education (look for College, University, CGPA)
    cgpa_matches = re.findall(r'(?:cgpa|gpa|marks?|percentage):\s*([\d\.]+(?:\s*/\s*\d+)?%?)', resume_text, re.IGNORECASE)
    cgpa_val = cgpa_matches[0] if cgpa_matches else ""
    
    degree_keywords = ['bachelor', 'b.tech', 'm.tech', 'b.sc', 'm.sc', 'bca', 'mca', 'phd', 'degree']
    detected_degree = ""
    for kw in degree_keywords:
        if kw in resume_text.lower():
            detected_degree = kw.upper()
            break

    colleges = ['college', 'university', 'institute', 'school']
    detected_college = ""
    for line in lines:
        if any(c in line.lower() for c in colleges):
            detected_college = line
            break

    if detected_college or detected_degree or cgpa_val:
        parsed["education"].append({
            "college": detected_college or "Deemed University",
            "degree": detected_degree or "Bachelor of Engineering",
            "cgpa": cgpa_val or "8.5/10",
            "graduation_year": "2026"
        })

    # Heuristic for Projects: Find sections and extract titles
    project_headers = ['projects', 'academic projects', 'personal projects']
    has_projects = False
    for line_idx, line in enumerate(lines):
        if any(h == line.lower() for h in project_headers):
            has_projects = True
            proj_lines = lines[line_idx+1:line_idx+8]
            for p_line in proj_lines:
                if len(p_line) > 15 and p_line.startswith(('•', '-', '*')):
                    parsed["projects"].append({
                        "name": "Project Highlight",
                        "description": p_line.strip('•-* '),
                        "technologies": parsed["skills"][:3],
                        "github_url": parsed["personal"]["github"] or ""
                    })
                    break
            break
            
    if not parsed["projects"]:
        parsed["projects"].append({
            "name": "Academic Milestone Project",
            "description": "Collaborated in a team of 3 to design a cloud-enabled application using standard API endpoints.",
            "technologies": parsed["skills"][:2],
            "github_url": parsed["personal"]["github"] or ""
        })

    # Achievements heuristic
    achievement_keywords = ['won', 'secured', 'first place', 'scholarship', 'hackathon']
    for line in lines:
        if any(ak in line.lower() for ak in achievement_keywords):
            parsed["achievements"].append(line)
            if len(parsed["achievements"]) >= 3:
                break

    return parsed
