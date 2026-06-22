from fastapi import APIRouter

from app.schemas.common import AnalysisResponse
from app.schemas.descriptive import SummaryStatisticsRequest
from app.services.descriptive.summary import run_summary_statistics

router = APIRouter(prefix="/descriptive", tags=["descriptive"])


@router.post("/summary-statistics", response_model=AnalysisResponse)
def summary_statistics(payload: SummaryStatisticsRequest) -> AnalysisResponse:
    return run_summary_statistics(payload.values)
