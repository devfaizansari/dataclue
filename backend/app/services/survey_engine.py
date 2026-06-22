from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.decomposition import FactorAnalysis

from app.schemas.common import StatResult
from app.utils.data_parser import parse_csv


def _prepare_survey_df(df: pd.DataFrame) -> pd.DataFrame:
    work = df.copy()
    for col in work.columns:
        numeric = pd.to_numeric(work[col], errors="coerce")
        if numeric.notna().sum() > 0:
            if numeric.notna().sum() >= work[col].notna().sum() * 0.5:
                work[col] = numeric
    return work


def _numeric_columns(df: pd.DataFrame) -> list[str]:
    return df.select_dtypes(include="number").columns.tolist()


def _categorical_columns(df: pd.DataFrame) -> list[str]:
    return df.select_dtypes(exclude="number").columns.tolist()


def _complete_numeric_subset(df: pd.DataFrame, num_cols: list[str], min_rows: int = 3) -> pd.DataFrame | None:
    if len(num_cols) < 3:
        return None

    ranked = sorted(num_cols, key=lambda c: df[c].notna().sum(), reverse=True)
    for count in range(min(len(ranked), 10), 2, -1):
        subset_cols = ranked[:count]
        data = df[subset_cols].dropna()
        if len(data) >= min_rows:
            return data

    return None


def _cronbach_alpha(data: pd.DataFrame) -> float | None:
    cols = _numeric_columns(data)
    if len(cols) < 2:
        return None
    items = data[cols].dropna()
    if len(items) < 2:
        return None
    k = len(cols)
    item_vars = items.var(axis=0, ddof=1)
    total_var = items.sum(axis=1).var(ddof=1)
    if not total_var:
        return None
    return float((k / (k - 1)) * (1 - item_vars.sum() / total_var))


def run_survey_analysis(csv_data: str, options: list[str]) -> dict[str, Any]:
    df = _prepare_survey_df(parse_csv(csv_data))
    num_cols = _numeric_columns(df)
    cat_cols = _categorical_columns(df)

    response_count = len(df)
    summary_stats: list[StatResult] = []
    sections: dict[str, Any] = {}
    interpretations: list[str] = []

    if "descriptive" in options and num_cols:
        col = num_cols[0]
        series = df[col].dropna()
        if len(series) > 0:
            mean_val = float(series.mean())
            summary_stats.extend(
                [
                    StatResult(label="Responses", value=str(response_count)),
                    StatResult(label="Mean", value=f"{mean_val:.2f}"),
                    StatResult(label="Std. Dev.", value=f"{series.std(ddof=1):.2f}"),
                ]
            )
            interpretations.append(f"Mean score = {mean_val:.2f} across {len(series)} responses.")

    if "frequency" in options:
        target_col = cat_cols[0] if cat_cols else (num_cols[0] if num_cols else None)
        if target_col is not None:
            counts = df[target_col].value_counts()
            likert_data = [{"label": str(k), "count": int(v)} for k, v in counts.items()]
            sections["likert"] = likert_data
            interpretations.append("Frequency tables generated for survey responses.")

    if "cronbach" in options and len(num_cols) >= 2:
        alpha = _cronbach_alpha(df)
        if alpha is not None:
            summary_stats.append(StatResult(label="Cronbach's α", value=f"{alpha:.3f}"))
            quality = "excellent" if alpha >= 0.9 else "good" if alpha >= 0.8 else "acceptable"
            interpretations.append(f"Cronbach's α = {alpha:.2f} ({quality} reliability).")
        else:
            interpretations.append("Cronbach's α skipped: not enough complete numeric responses.")

    if "crosstab" in options and len(cat_cols) >= 2:
        table = pd.crosstab(df[cat_cols[0]], df[cat_cols[1]])
        sections["crosstab"] = table.to_dict()
        interpretations.append(f"Cross-tabulation: {table.shape[0]}×{table.shape[1]} table.")

    if "factor" in options:
        factor_data = _complete_numeric_subset(df, num_cols)
        if factor_data is not None and factor_data.shape[1] >= 3:
            try:
                n_factors = min(2, factor_data.shape[1] - 1)
                fa = FactorAnalysis(n_components=n_factors, random_state=42)
                fa.fit(factor_data)
                sections["factor"] = {
                    "factors": n_factors,
                    "variables": int(factor_data.shape[1]),
                    "rows_used": int(len(factor_data)),
                }
                interpretations.append(
                    f"Factor analysis: {n_factors} factors from {factor_data.shape[1]} items "
                    f"({len(factor_data)} complete responses)."
                )
            except ValueError:
                interpretations.append("Factor analysis skipped: data not suitable for factor analysis.")
        else:
            interpretations.append(
                "Factor analysis skipped: need at least 3 numeric columns with complete responses."
            )

    # NPS: find first numeric column that looks like 0-10 scores
    if num_cols:
        nps_col = next(
            (col for col in num_cols if df[col].dropna().between(0, 10).all() and len(df[col].dropna()) > 0),
            None,
        )
        if nps_col:
            scores = df[nps_col].dropna().astype(float)
            promoters = int((scores >= 9).sum())
            passives = int(((scores >= 7) & (scores <= 8)).sum())
            detractors = int((scores <= 6).sum())
            total = len(scores)
            nps = round((promoters - detractors) / total * 100)
            sections["nps"] = {
                "score": nps,
                "data": [
                    {"name": "Detractors", "value": detractors, "color": "#ef4444"},
                    {"name": "Passives", "value": passives, "color": "#f59e0b"},
                    {"name": "Promoters", "value": promoters, "color": "#22c55e"},
                ],
            }
            summary_stats.append(StatResult(label="NPS Score", value=f"+{nps}"))

    if cat_cols:
        feature_col = cat_cols[-1]
        counts = df[feature_col].value_counts()
        sections["features"] = [{"name": str(k), "value": int(v)} for k, v in counts.items()]

    if not summary_stats:
        summary_stats.append(StatResult(label="Responses", value=str(response_count)))

    mean_satisfaction = None
    if num_cols:
        first_series = df[num_cols[0]].dropna()
        if len(first_series) > 0:
            mean_satisfaction = round(float(first_series.mean()), 2)

    return {
        "response_count": response_count,
        "mean_satisfaction": mean_satisfaction,
        "nps_score": sections.get("nps", {}).get("score"),
        "stats": [s.model_dump() for s in summary_stats],
        "sections": sections,
        "interpretation": " ".join(interpretations) if interpretations else "Survey analysis complete.",
    }
