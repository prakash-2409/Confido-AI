"""
Interview Answer Evaluator

Evaluates interview answers using:
- Keyword matching and coverage
- Answer length and structure analysis
- Relevance scoring using TF-IDF similarity
- Category-specific evaluation criteria
"""

import re
from typing import List, Dict, Tuple
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

# Ensure NLTK data is available
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')


class InterviewEvaluator:
    """Evaluates interview answers without using LLMs"""
    
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
        # STAR method keywords for behavioral questions
        self.star_keywords = {
            'situation': ['situation', 'context', 'background', 'when', 'where', 'project', 'role'],
            'task': ['task', 'responsibility', 'goal', 'objective', 'challenge', 'problem', 'needed'],
            'action': ['action', 'did', 'implemented', 'created', 'developed', 'led', 'managed', 'decided', 'approach'],
            'result': ['result', 'outcome', 'achieved', 'improved', 'increased', 'decreased', 'learned', 'success', 'impact']
        }
        
        # Quality indicators
        self.quality_words = [
            'specifically', 'example', 'instance', 'because', 'therefore',
            'however', 'additionally', 'furthermore', 'consequently', 'importantly'
        ]
        
        # Action verbs that indicate strong answers
        self.action_verbs = [
            'achieved', 'built', 'created', 'designed', 'developed', 'established',
            'implemented', 'improved', 'increased', 'led', 'managed', 'optimized',
            'reduced', 'resolved', 'streamlined', 'transformed', 'delivered'
        ]
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        return text.lower().strip()
    
    def tokenize(self, text: str) -> List[str]:
        """Tokenize and remove stopwords"""
        cleaned = self.clean_text(text)
        tokens = word_tokenize(cleaned)
        return [w for w in tokens if w not in self.stop_words and len(w) > 2]
    
    def calculate_keyword_score(self, answer_text: str, expected_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        """
        Calculate keyword coverage score
        Returns: (score, keywords_found, keywords_missed)
        """
        answer_lower = answer_text.lower()
        answer_tokens = set(self.tokenize(answer_text))
        
        found = []
        missed = []
        
        for keyword in expected_keywords:
            keyword_lower = keyword.lower()
            # Check for exact match or partial match in tokens
            if keyword_lower in answer_lower or any(keyword_lower in token for token in answer_tokens):
                found.append(keyword)
            else:
                missed.append(keyword)
        
        if not expected_keywords:
            return 70.0, found, missed  # Default score if no keywords expected
        
        coverage = len(found) / len(expected_keywords)
        score = min(100, coverage * 100 + 20)  # Base 20 points + coverage
        
        return round(score, 2), found, missed
    
    def calculate_length_score(self, answer_text: str, category: str) -> Tuple[float, str]:
        """
        Evaluate answer length appropriateness
        Returns: (score, feedback)
        """
        word_count = len(answer_text.split())
        sentences = sent_tokenize(answer_text)
        sentence_count = len(sentences)
        
        # Ideal ranges based on category
        ideal_ranges = {
            'behavioral': (100, 250),  # STAR answers should be detailed
            'technical': (75, 200),
            'situational': (80, 200)
        }
        
        min_words, max_words = ideal_ranges.get(category, (75, 200))
        
        if word_count < min_words * 0.5:
            return 50.0, "Answer is too brief. Provide more detail and specific examples."
        elif word_count < min_words:
            return 70.0, "Answer could be more detailed. Consider adding specific examples."
        elif word_count > max_words * 1.5:
            return 75.0, "Answer is quite long. Consider being more concise while keeping key points."
        elif word_count > max_words:
            return 85.0, "Good detail level, though slightly long."
        else:
            return 95.0, "Appropriate answer length."
    
    def calculate_structure_score(self, answer_text: str, category: str) -> Tuple[float, List[str], List[str]]:
        """
        Evaluate answer structure and quality
        Returns: (score, strengths, improvements)
        """
        answer_lower = answer_text.lower()
        tokens = self.tokenize(answer_text)
        token_set = set(tokens)
        
        strengths = []
        improvements = []
        score = 60  # Base score
        
        # Check for STAR method elements in behavioral questions
        if category == 'behavioral':
            star_found = []
            star_missing = []
            
            for component, keywords in self.star_keywords.items():
                if any(kw in answer_lower for kw in keywords):
                    star_found.append(component)
                else:
                    star_missing.append(component)
            
            if len(star_found) >= 3:
                score += 20
                strengths.append("Good use of STAR method structure")
            elif len(star_found) >= 2:
                score += 10
                strengths.append("Partial STAR method structure")
            
            if star_missing:
                improvements.append(f"Consider adding more about: {', '.join(star_missing)}")
        
        # Check for quality indicators
        quality_count = sum(1 for word in self.quality_words if word in answer_lower)
        if quality_count >= 3:
            score += 10
            strengths.append("Well-articulated response with clear reasoning")
        elif quality_count >= 1:
            score += 5
        
        # Check for action verbs
        action_count = sum(1 for verb in self.action_verbs if verb in answer_lower)
        if action_count >= 3:
            score += 10
            strengths.append("Strong use of action verbs demonstrating ownership")
        elif action_count >= 1:
            score += 5
        
        # Check for specific examples
        if any(phrase in answer_lower for phrase in ['for example', 'for instance', 'specifically', 'such as']):
            score += 5
            strengths.append("Includes specific examples")
        else:
            improvements.append("Consider adding specific examples to strengthen your answer")
        
        # Check for quantifiable results
        if re.search(r'\d+%|\d+ percent|\$\d+|\d+ (users|customers|team|people|projects)', answer_lower):
            score += 10
            strengths.append("Includes quantifiable results/metrics")
        else:
            if category in ['behavioral', 'technical']:
                improvements.append("Consider adding quantifiable metrics or results")
        
        return min(100, score), strengths, improvements
    
    def calculate_relevance_score(self, question_text: str, answer_text: str) -> float:
        """
        Calculate semantic relevance between question and answer using TF-IDF
        """
        try:
            clean_question = self.clean_text(question_text)
            clean_answer = self.clean_text(answer_text)
            
            corpus = [clean_question, clean_answer]
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Scale to 0-100 with a minimum base
            return round(max(40, similarity * 100 + 30), 2)
        except Exception:
            return 60.0  # Default score on error
    
    def evaluate_answer(
        self,
        question_text: str,
        category: str,
        answer_text: str,
        expected_keywords: List[str] = None,
        job_role: str = None,
        job_description: str = None
    ) -> Dict:
        """
        Comprehensive answer evaluation
        Returns evaluation results with score, feedback, strengths, and improvements
        """
        if expected_keywords is None:
            expected_keywords = []
        
        # Calculate individual scores
        keyword_score, keywords_found, keywords_missed = self.calculate_keyword_score(
            answer_text, expected_keywords
        )
        
        length_score, length_feedback = self.calculate_length_score(answer_text, category)
        
        structure_score, structure_strengths, structure_improvements = self.calculate_structure_score(
            answer_text, category
        )
        
        relevance_score = self.calculate_relevance_score(question_text, answer_text)
        
        # Weighted final score
        weights = {
            'keyword': 0.25,
            'length': 0.15,
            'structure': 0.35,
            'relevance': 0.25
        }
        
        final_score = (
            keyword_score * weights['keyword'] +
            length_score * weights['length'] +
            structure_score * weights['structure'] +
            relevance_score * weights['relevance']
        )
        
        # Compile strengths
        strengths = structure_strengths.copy()
        if keyword_score >= 80:
            strengths.append("Good coverage of key concepts")
        if relevance_score >= 80:
            strengths.append("Answer is highly relevant to the question")
        
        # Compile improvements
        improvements = structure_improvements.copy()
        if length_feedback and "too brief" in length_feedback.lower():
            improvements.insert(0, length_feedback)
        if keyword_score < 60 and keywords_missed:
            improvements.append(f"Consider addressing: {', '.join(keywords_missed[:3])}")
        
        # Ensure at least one strength
        if not strengths:
            strengths.append("Answered the question directly")
        
        # Ensure at least one improvement (unless perfect)
        if not improvements and final_score < 95:
            improvements.append("Practice elaborating with more specific details")
        
        # Generate feedback summary
        if final_score >= 85:
            feedback = "Excellent answer! You demonstrated strong understanding and communicated effectively."
        elif final_score >= 70:
            feedback = "Good answer with solid points. Some areas could be strengthened with more detail or examples."
        elif final_score >= 55:
            feedback = "Adequate answer, but missing key elements. Focus on providing more specific examples and addressing all aspects of the question."
        else:
            feedback = "Answer needs improvement. Consider using the STAR method for behavioral questions and providing concrete examples."
        
        return {
            "score": round(final_score, 2),
            "feedback": feedback,
            "strengths": strengths[:5],  # Limit to top 5
            "improvements": improvements[:5],  # Limit to top 5
            "keywords_found": keywords_found,
            "keywords_missed": keywords_missed
        }
    
    def generate_summary(
        self,
        job_role: str,
        job_description: str,
        answers: List[Dict]
    ) -> Dict:
        """
        Generate comprehensive interview summary
        
        Args:
            job_role: Target job role
            job_description: Job description text
            answers: List of answer evaluations with category, score, strengths, improvements
        
        Returns:
            Summary with overall score, readiness level, strong/weak areas, recommendations
        """
        if not answers:
            return {
                "overall_score": 0,
                "readiness_level": "Low",
                "strong_areas": [],
                "weak_areas": ["No answers provided"],
                "category_scores": {"behavioral": 0, "technical": 0, "situational": 0},
                "recommendations": ["Complete the interview to receive feedback"],
                "feedback_summary": "Interview incomplete."
            }
        
        # Calculate category scores
        category_scores = {"behavioral": [], "technical": [], "situational": []}
        all_strengths = []
        all_improvements = []
        
        for answer in answers:
            category = answer.get("category", "technical")
            score = answer.get("score", 0)
            
            if category in category_scores:
                category_scores[category].append(score)
            
            all_strengths.extend(answer.get("strengths", []))
            all_improvements.extend(answer.get("improvements", []))
        
        # Calculate average scores per category
        avg_category_scores = {}
        for cat, scores in category_scores.items():
            avg_category_scores[cat] = round(sum(scores) / len(scores), 2) if scores else None
        
        # Calculate overall score (weighted by number of questions in each category)
        total_scores = []
        for scores in category_scores.values():
            total_scores.extend(scores)
        
        overall_score = round(sum(total_scores) / len(total_scores), 2) if total_scores else 0
        
        # Determine readiness level
        if overall_score >= 80:
            readiness_level = "High"
        elif overall_score >= 60:
            readiness_level = "Medium"
        else:
            readiness_level = "Low"
        
        # Identify strong and weak areas
        strong_areas = []
        weak_areas = []
        
        for cat, score in avg_category_scores.items():
            if score is not None:
                if score >= 75:
                    strong_areas.append(f"{cat.capitalize()} questions")
                elif score < 60:
                    weak_areas.append(f"{cat.capitalize()} questions")
        
        # Count most common strengths and improvements
        strength_counter = Counter(all_strengths)
        improvement_counter = Counter(all_improvements)
        
        # Add specific strength areas
        top_strengths = [s for s, _ in strength_counter.most_common(3)]
        for strength in top_strengths:
            if strength not in strong_areas:
                strong_areas.append(strength)
        
        # Limit strong areas
        strong_areas = strong_areas[:5]
        
        # Generate recommendations based on weak areas
        recommendations = []
        
        if avg_category_scores.get("behavioral") and avg_category_scores["behavioral"] < 70:
            recommendations.append("Practice using the STAR method (Situation, Task, Action, Result) for behavioral questions")
        
        if avg_category_scores.get("technical") and avg_category_scores["technical"] < 70:
            recommendations.append("Review technical fundamentals and practice explaining concepts clearly")
        
        if avg_category_scores.get("situational") and avg_category_scores["situational"] < 70:
            recommendations.append("Practice thinking through hypothetical scenarios and structuring your approach")
        
        # Add common improvement areas as recommendations
        for improvement, _ in improvement_counter.most_common(2):
            if improvement not in recommendations:
                recommendations.append(improvement)
        
        # Ensure we have recommendations
        if not recommendations:
            if overall_score >= 85:
                recommendations.append("Continue practicing to maintain your strong interview skills")
            else:
                recommendations.append("Practice with more mock interviews to build confidence")
        
        recommendations = recommendations[:5]  # Limit to 5
        
        # Generate feedback summary
        if readiness_level == "High":
            feedback_summary = f"Excellent interview performance for {job_role}! You demonstrated strong communication skills and relevant experience. You are well-prepared for interviews in this role."
        elif readiness_level == "Medium":
            feedback_summary = f"Good interview performance with room for improvement. You have a solid foundation for {job_role}, but should focus on strengthening your responses with more specific examples and clearer structure."
        else:
            feedback_summary = f"Your interview performance indicates areas needing development for {job_role}. Focus on the recommended improvements and practice regularly to build confidence and clarity in your responses."
        
        return {
            "overall_score": overall_score,
            "readiness_level": readiness_level,
            "strong_areas": strong_areas,
            "weak_areas": weak_areas,
            "category_scores": avg_category_scores,
            "recommendations": recommendations,
            "feedback_summary": feedback_summary
        }


# Singleton instance
interview_evaluator = InterviewEvaluator()
