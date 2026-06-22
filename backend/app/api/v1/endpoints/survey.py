from pydantic import BaseModel, Field

from fastapi import APIRouter

from app.services.survey_engine import run_survey_analysis

router = APIRouter(prefix="/survey", tags=["survey"])


class SurveyAnalysisRequest(BaseModel):
    csv_data: str = Field(..., description="Raw CSV survey responses")
    options: list[str] = Field(default_factory=list)


@router.post("/analyze")
def survey_analyze(payload: SurveyAnalysisRequest) -> dict:
    return run_survey_analysis(payload.csv_data, payload.options)
