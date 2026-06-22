from fastapi import APIRouter

router = APIRouter(prefix="/correlation", tags=["correlation"])

# Endpoints: pearson, spearman, kendall, partial, point-biserial
