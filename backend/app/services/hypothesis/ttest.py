import numpy as np
from scipy import stats

from app.schemas.common import AnalysisResponse, StatResult


def run_independent_ttest(
    group_a: list[float],
    group_b: list[float],
    equal_var: bool = True,
    alternative: str = "two-sided",
) -> AnalysisResponse:
    a = np.array(group_a, dtype=float)
    b = np.array(group_b, dtype=float)

    result = stats.ttest_ind(a, b, equal_var=equal_var, alternative=alternative)
    t_stat = float(result.statistic)
    p_value = float(result.pvalue)
    df = len(a) + len(b) - 2

    pooled_std = np.sqrt(
        ((len(a) - 1) * a.var(ddof=1) + (len(b) - 1) * b.var(ddof=1)) / df
    )
    cohens_d = (a.mean() - b.mean()) / pooled_std if pooled_std else 0.0

    significant = p_value < 0.05
    p_str = f"{p_value:.4f}" if p_value >= 0.001 else "< .001"

    return AnalysisResponse(
        test_id="independent-ttest",
        title="Independent Samples t-Test",
        stats=[
            StatResult(label="t-statistic", value=f"{t_stat:.4f}"),
            StatResult(label="Degrees of freedom", value=str(int(df))),
            StatResult(
                label="p-value (two-tailed)",
                value=p_str,
                badge={
                    "text": "Significant" if significant else "Not significant",
                    "variant": "success" if significant else "neutral",
                },
            ),
            StatResult(label="Cohen's d", value=f"{cohens_d:.4f}"),
            StatResult(label="Mean Group A", value=f"{a.mean():.4f}"),
            StatResult(label="Mean Group B", value=f"{b.mean():.4f}"),
        ],
        interpretation=(
            f"Group A (M = {a.mean():.2f}, SD = {a.std(ddof=1):.2f}) and "
            f"Group B (M = {b.mean():.2f}, SD = {b.std(ddof=1):.2f}) "
            f"differed significantly, t({int(df)}) = {t_stat:.2f}, p = {p_str}, "
            f"Cohen's d = {cohens_d:.2f}."
            if significant
            else f"No significant difference was found between groups, p = {p_str}."
        ),
        apa_output=(
            f"An independent-samples t-test indicated that scores for Group A "
            f"(M = {a.mean():.2f}, SD = {a.std(ddof=1):.2f}) and Group B "
            f"(M = {b.mean():.2f}, SD = {b.std(ddof=1):.2f}) "
            f"{'differed significantly' if significant else 'did not differ significantly'}, "
            f"t({int(df)}) = {t_stat:.2f}, p = {p_str}, d = {cohens_d:.2f}."
        ),
    )
