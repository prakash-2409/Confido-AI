"""
ML Service Unit Tests

Tests for ATS analyzer, interview evaluator, and API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.ats import ats_analyzer
from app.models.interview_evaluator import interview_evaluator


client = TestClient(app)


# ============================================================
# Health Check Tests
# ============================================================

class TestHealthCheck:
    def test_health_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    def test_health_returns_llm_status(self):
        response = client.get("/")
        data = response.json()
        assert "llm_available" in data


# ============================================================
# ATS Analyzer Tests
# ============================================================

class TestATSAnalyzer:
    def test_analyze_returns_score(self):
        result = ats_analyzer.analyze(
            "Experienced Python developer with React and Node.js skills",
            "Looking for a Python developer with React experience"
        )
        assert "score" in result
        assert 0 <= result["score"] <= 100

    def test_analyze_returns_keywords(self):
        result = ats_analyzer.analyze(
            "Python developer with machine learning experience",
            "Python machine learning engineer with TensorFlow"
        )
        assert "matched_keywords" in result
        assert "missing_keywords" in result
        assert isinstance(result["matched_keywords"], list)
        assert isinstance(result["missing_keywords"], list)

    def test_analyze_high_match(self):
        resume = "Experienced Python developer with React, Node.js, AWS, Docker, and CI/CD pipeline experience"
        jd = "Python developer with React, Node.js, AWS, and Docker experience needed"
        result = ats_analyzer.analyze(resume, jd)
        assert result["score"] > 50

    def test_analyze_low_match(self):
        result = ats_analyzer.analyze(
            "I like cooking and gardening",
            "Senior software engineer with 10 years Java experience"
        )
        assert result["score"] < 50

    def test_analyze_endpoint(self):
        response = client.post("/analyze", json={
            "resume_text": "Python developer with Django REST framework experience",
            "job_description": "Looking for a Python Django developer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "matched_keywords" in data

    def test_analyze_endpoint_missing_fields(self):
        response = client.post("/analyze", json={
            "resume_text": "",
            "job_description": ""
        })
        assert response.status_code in [400, 500]


# ============================================================
# Interview Evaluator Tests
# ============================================================

class TestInterviewEvaluator:
    def test_evaluate_answer_returns_score(self):
        result = interview_evaluator.evaluate_answer(
            question_text="Tell me about a time you led a team project",
            category="behavioral",
            answer_text="In my previous role, I led a team of 5 developers on a web application project. The situation required us to deliver within a tight deadline. I organized daily standups and implemented agile methodology. As a result, we delivered the project 2 days early with 95% test coverage.",
            expected_keywords=["leadership", "team", "project"]
        )
        assert "score" in result
        assert 0 <= result["score"] <= 100
        assert "feedback" in result
        assert "strengths" in result
        assert "improvements" in result

    def test_evaluate_behavioral_star_method(self):
        # Answer with STAR method should score higher
        star_answer = """In my previous role as tech lead (situation), I needed to deliver a critical 
        feature for our largest client (task). I organized the team into pods, set up daily check-ins, 
        and personally reviewed all code changes (action). As a result, we delivered 3 days early 
        and the client renewed their contract worth $500K (result)."""
        
        brief_answer = "I managed a team once. It went well."
        
        star_result = interview_evaluator.evaluate_answer(
            question_text="Tell me about a leadership experience",
            category="behavioral",
            answer_text=star_answer,
            expected_keywords=["leadership", "team"]
        )
        
        brief_result = interview_evaluator.evaluate_answer(
            question_text="Tell me about a leadership experience",
            category="behavioral",
            answer_text=brief_answer,
            expected_keywords=["leadership", "team"]
        )
        
        assert star_result["score"] > brief_result["score"]

    def test_evaluate_technical_answer(self):
        result = interview_evaluator.evaluate_answer(
            question_text="Explain how you would design a REST API",
            category="technical",
            answer_text="I would design RESTful endpoints following best practices. For example, I would use proper HTTP methods (GET, POST, PUT, DELETE), implement pagination for list endpoints, use JWT authentication, and implement rate limiting. I would also ensure proper error handling with appropriate status codes.",
            expected_keywords=["REST", "API", "HTTP", "authentication"]
        )
        assert result["score"] >= 50
        assert len(result["keywords_found"]) > 0

    def test_evaluate_endpoint(self):
        response = client.post("/interview/evaluate", json={
            "question_text": "What is your greatest strength?",
            "category": "behavioral",
            "answer_text": "My greatest strength is problem-solving. For example, at my previous company I identified a performance bottleneck and implemented caching that improved response times by 60%.",
            "expected_keywords": ["strength", "problem-solving"],
            "job_role": "Software Engineer",
            "job_description": "We need a problem solver"
        })
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "feedback" in data

    def test_evaluate_endpoint_missing_fields(self):
        response = client.post("/interview/evaluate", json={
            "question_text": "",
            "category": "",
            "answer_text": ""
        })
        assert response.status_code in [400, 500]


# ============================================================
# Interview Summary Tests
# ============================================================

class TestInterviewSummary:
    def test_generate_summary(self):
        answers = [
            {"category": "behavioral", "score": 85, "strengths": ["Good STAR method"], "improvements": []},
            {"category": "technical", "score": 70, "strengths": ["Clear explanation"], "improvements": ["Add more examples"]},
            {"category": "situational", "score": 75, "strengths": ["Practical approach"], "improvements": []},
        ]
        
        result = interview_evaluator.generate_summary(
            job_role="Software Engineer",
            job_description="Full-stack developer needed",
            answers=answers
        )
        
        assert "overall_score" in result
        assert "readiness_level" in result
        assert result["readiness_level"] in ["Low", "Medium", "High"]
        assert "category_scores" in result
        assert "recommendations" in result

    def test_summary_empty_answers(self):
        result = interview_evaluator.generate_summary(
            job_role="Engineer",
            job_description="",
            answers=[]
        )
        assert result["overall_score"] == 0
        assert result["readiness_level"] == "Low"

    def test_summary_endpoint(self):
        response = client.post("/interview/summary", json={
            "job_role": "Software Engineer",
            "job_description": "Full-stack developer",
            "answers": [
                {"category": "behavioral", "score": 80, "strengths": ["Good"], "improvements": []},
                {"category": "technical", "score": 65, "strengths": [], "improvements": ["More detail"]},
            ]
        })
        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "readiness_level" in data
        assert "recommendations" in data


# ============================================================
# Keyword and Text Processing Tests
# ============================================================

class TestTextProcessing:
    def test_clean_text(self):
        cleaned = ats_analyzer.clean_text("Hello, World! @#$%")
        assert cleaned == "hello world"

    def test_extract_keywords(self):
        keywords = ats_analyzer.extract_keywords("Python developer with machine learning and AI experience in data science")
        assert isinstance(keywords, list)
        assert len(keywords) > 0

    def test_calculate_similarity(self):
        score = ats_analyzer.calculate_similarity(
            "Python web developer",
            "Python web developer needed"
        )
        assert 0 <= score <= 100
