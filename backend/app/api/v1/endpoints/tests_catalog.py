from fastapi import APIRouter

from app.services.statistical_engine import list_tests

router = APIRouter(tags=["tests"])


@router.get("/tests")
def get_tests() -> dict:
    return {"tests": list_tests(), "count": len(list_tests())}
