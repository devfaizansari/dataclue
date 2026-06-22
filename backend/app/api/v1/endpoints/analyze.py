from fastapi import APIRouter

from app.schemas.common import AnalysisResponse, CsvAnalysisRequest
from app.services.statistical_engine import run_analysis

router = APIRouter(tags=["analyze"])


@router.post("/analyze", response_model=AnalysisResponse)
def analyze(payload: CsvAnalysisRequest) -> AnalysisResponse:
    return run_analysis(payload.test_id, payload.csv_data, payload.options)
