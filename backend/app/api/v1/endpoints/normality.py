from fastapi import APIRouter

router = APIRouter(prefix="/normality", tags=["normality"])

# Endpoints: shapiro-wilk, kolmogorov-smirnov, anderson-darling, levene, bartlett
