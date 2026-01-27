from fastapi import FastAPI, HTTPException
from app.models.schemas import ResumeRequest, ATSAnalysisResponse, HealthResponse
from app.models.ats import ats_analyzer
import uvicorn

app = FastAPI(
    title="Career AI - ML Service",
    description="Microservice for ATS Scoring and Resume Analysis",
    version="1.0.0"
)

@app.get("/", response_model=HealthResponse)
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/analyze", response_model=ATSAnalysisResponse)
async def analyze_resume(request: ResumeRequest):
    try:
        if not request.resume_text or not request.job_description:
            raise HTTPException(status_code=400, detail="Resume text and Job Description are required")
            
        result = ats_analyzer.analyze(request.resume_text, request.job_description)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
