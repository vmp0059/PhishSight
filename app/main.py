
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.risk_assessor import assess_url_risk
from app.url_analyzer import extract_url_features


app = FastAPI(
    title="PHISHSIGHT API",
    description=(
        "An explainable phishing URL analysis platform. "
        "Rule-based findings are not proof of malicious activity."
    ),
    version="0.2.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request and response contracts ----------

class URLAnalysisRequest(BaseModel):
    url: str = Field(
        description="The URL to analyze. HTTP or HTTPS URLs are supported.",
        examples=["https://example.com/login"],
    )


class IndicatorResponse(BaseModel):
    code: str
    severity: Literal["elevated", "caution"]
    message: str


class AssessmentResponse(BaseModel):
    method: str
    rules_version: str
    category: Literal[
        "review_recommended",
        "caution",
        "no_obvious_indicators",
    ]
    summary: str
    indicator_count: int
    indicators: list[IndicatorResponse]
    limitations: str


class MLPredictionResponse(BaseModel):
    status: Literal["not_available"]
    message: str


class URLAnalysisResponse(BaseModel):
    url: str
    features: dict[str, int | bool]
    assessment: AssessmentResponse
    ml_prediction: MLPredictionResponse


# ---------- API endpoints ----------

@app.get("/")
def home():
    return {
        "project": "PHISHSIGHT",
        "message": "Phishing detection API is running!",
        "status": "online",
        "api_version": "0.2.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": False,
        "components": {
            "url_analyzer": "ready",
            "heuristic_assessor": "ready",
            "ml_model": "not_loaded",
        },
    }


@app.post(
    "/analyze-url",
    response_model=URLAnalysisResponse,
)
def analyze_url(request: URLAnalysisRequest):
    try:
        features = extract_url_features(request.url)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    assessment = assess_url_risk(features)

    return {
        "url": request.url,
        "features": features,
        "assessment": assessment,
        "ml_prediction": {
            "status": "not_available",
            "message": (
                "The ML model has not been trained or connected yet. "
                "Only URL features and heuristic findings are available."
            ),
        },
    }
