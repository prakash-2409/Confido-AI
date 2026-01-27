import re
import math
from typing import List, Tuple
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Download NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

class ATSAnalyzer:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def clean_text(self, text: str) -> str:
        """
        Clean text by removing special chars, converting to lowercase
        """
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        return text.lower().strip()

    def extract_keywords(self, text: str, top_n: int = 20) -> List[str]:
        """
        Extract top keywords using simple frequency analysis (for simplicity)
        In production, we'd use KeyBERT or more advanced NLP
        """
        cleaned = self.clean_text(text)
        tokens = word_tokenize(cleaned)
        # Remove stopwords and short words
        tokens = [w for w in tokens if w not in self.stop_words and len(w) > 2]
        
        # Count frequency
        counter = Counter(tokens)
        return [word for word, count in counter.most_common(top_n)]

    def calculate_similarity(self, resume_text: str, jd_text: str) -> float:
        """
        Calculate cosine similarity between Resume and JD using TF-IDF
        """
        # Clean both texts
        clean_resume = self.clean_text(resume_text)
        clean_jd = self.clean_text(jd_text)
        
        corpus = [clean_resume, clean_jd]
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            # Convert to percentage (0-100)
            return round(similarity * 100, 2)
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            return 0.0

    def analyze(self, resume_text: str, jd_text: str) -> dict:
        """
        Full analysis: Score + Keyword Gap Analysis
        """
        score = self.calculate_similarity(resume_text, jd_text)
        
        jd_keywords = self.extract_keywords(jd_text, top_n=20)
        resume_keywords_set = set(self.extract_keywords(resume_text, top_n=100))
        
        missing = [kw for kw in jd_keywords if kw not in resume_keywords_set]
        matched = [kw for kw in jd_keywords if kw in resume_keywords_set]
        
        return {
            "score": score,
            "missing_keywords": missing,
            "matched_keywords": matched
        }

# Singleton instance
ats_analyzer = ATSAnalyzer()
