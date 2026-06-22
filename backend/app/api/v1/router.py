from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    analyze,
    blogs,
    correlation,
    descriptive,
    health,
    hypothesis,
    normality,
    other,
    parse_data,
    regression,
    survey,
    tests_catalog,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(tests_catalog.router)
api_router.include_router(parse_data.router)
api_router.include_router(blogs.router)
api_router.include_router(admin.router)
api_router.include_router(analyze.router)
api_router.include_router(survey.router)
# Legacy per-category routes (optional direct access)
api_router.include_router(descriptive.router)
api_router.include_router(hypothesis.router)
api_router.include_router(regression.router)
api_router.include_router(correlation.router)
api_router.include_router(normality.router)
api_router.include_router(other.router)
