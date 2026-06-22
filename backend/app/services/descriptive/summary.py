import numpy as np
from scipy import stats

from app.schemas.common import AnalysisResponse, StatResult


def run_summary_statistics(values: list[float]) -> AnalysisResponse:
    arr = np.array(values, dtype=float)
    q1, q2, q3 = np.percentile(arr, [25, 50, 75])

    return AnalysisResponse(
        test_id="summary-statistics",
        title="Summary Statistics",
        stats=[
            StatResult(label="N", value=str(len(arr))),
            StatResult(label="Mean", value=f"{arr.mean():.4f}"),
            StatResult(label="Median", value=f"{q2:.4f}"),
            StatResult(label="Std. Deviation", value=f"{arr.std(ddof=1):.4f}"),
            StatResult(label="Variance", value=f"{arr.var(ddof=1):.4f}"),
            StatResult(label="Min", value=f"{arr.min():.4f}"),
            StatResult(label="Max", value=f"{arr.max():.4f}"),
            StatResult(label="Q1", value=f"{q1:.4f}"),
            StatResult(label="Q3", value=f"{q3:.4f}"),
        ],
        interpretation=f"The dataset contains {len(arr)} observations with a mean of {arr.mean():.2f} (SD = {arr.std(ddof=1):.2f}).",
    )
