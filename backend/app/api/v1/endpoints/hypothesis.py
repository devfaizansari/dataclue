from fastapi import APIRouter

from app.schemas.common import AnalysisResponse
from app.schemas.hypothesis import IndependentTTestRequest
from app.services.hypothesis.ttest import run_independent_ttest

router = APIRouter(prefix="/hypothesis", tags=["hypothesis"])


@router.post("/independent-ttest", response_model=AnalysisResponse)
def independent_ttest(payload: IndependentTTestRequest) -> AnalysisResponse:
    return run_independent_ttest(
        group_a=payload.group_a,
        group_b=payload.group_b,
        equal_var=payload.equal_var,
        alternative=payload.alternative,
    )
