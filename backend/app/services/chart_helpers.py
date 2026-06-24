from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from scipy import stats

from app.schemas.common import AnalysisResponse
from app.services.column_utils import (
    aligned_two_numeric,
    categorical_columns,
    first_numeric,
    numeric_columns,
    two_categorical,
    value_and_group,
)
from app.core.exceptions import DataValidationError
from app.services.ml_preprocessing import apply_feature_method


def histogram_bins(arr: np.ndarray, bins: int = 10) -> list[dict[str, str | int]]:
    counts, edges = np.histogram(arr, bins=bins)
    return [
        {"bin": f"{edges[i]:.1f}–{edges[i + 1]:.1f}", "count": int(counts[i])}
        for i in range(len(counts))
    ]


def build_qq_plot(arr: np.ndarray) -> list[dict[str, float]]:
    values = np.sort(np.asarray(arr, dtype=float))
    values = values[np.isfinite(values)]
    if len(values) < 2:
        return []
    n = len(values)
    probs = (np.arange(1, n + 1) - 0.5) / n
    theoretical = stats.norm.ppf(probs)
    return [
        {"theoretical": round(float(t), 4), "sample": round(float(s), 4)}
        for t, s in zip(theoretical, values, strict=False)
    ]


def dataframe_to_csv(df: pd.DataFrame) -> str:
    return df.to_csv(index=False)


def build_variable_csv(arr: np.ndarray, variable_name: str) -> str:
    values = np.asarray(arr, dtype=float)
    values = values[np.isfinite(values)]
    frame = pd.DataFrame({variable_name: values})
    return dataframe_to_csv(frame)


def build_qq_csv(qq_points: list[dict[str, float]], variable_name: str) -> str:
    frame = pd.DataFrame(qq_points)
    frame.columns = [f"theoretical_quantile_{variable_name}", f"sample_quantile_{variable_name}"]
    return dataframe_to_csv(frame)


def build_normalized_variable_csv(
    df: pd.DataFrame,
    options: dict | None,
    method: str = "quantile",
) -> tuple[str, str]:
    series = first_numeric(df, options)
    variable_name = str(
        options.get("value_column") if options else None
        or series.name
        or "variable"
    )
    frame = pd.DataFrame({variable_name: pd.to_numeric(series, errors="coerce")}).dropna()
    transformed, _ = apply_feature_method(frame, [variable_name], method)
    return dataframe_to_csv(transformed), variable_name


def append_download(
    downloads: list[dict[str, str]],
    label: str,
    filename: str,
    content: str,
) -> None:
    downloads.append(
        {
            "label": label,
            "filename": filename,
            "content": content,
            "format": "csv",
        }
    )


def build_group_means_chart(df: pd.DataFrame, options: dict | None = None) -> list[dict[str, str | float]]:
    values, groups = value_and_group(df, options)
    grouped: dict[str, list[float]] = {}
    for group_name, value in zip(groups, values, strict=False):
        grouped.setdefault(str(group_name), []).append(float(value))
    return [
        {
            "group": name,
            "mean": round(float(np.mean(vals)), 2),
            "sd": round(float(np.std(vals, ddof=1)), 2),
        }
        for name, vals in grouped.items()
    ]


def build_scatter_chart(df: pd.DataFrame, options: dict | None = None) -> list[dict[str, float]]:
    x, y = aligned_two_numeric(df, options)
    return [{"x": float(a), "y": float(b)} for a, b in zip(x, y, strict=False)]


GROUP_COMPARISON_TESTS = {
    "independent-ttest",
    "mann-whitney",
    "one-way-anova",
    "kruskal-wallis",
    "levene-test",
    "bartlett-test",
}

HISTOGRAM_TESTS = {
    "summary-statistics",
    "percentiles",
    "one-sample-ttest",
    "shapiro-wilk",
    "kolmogorov-smirnov",
    "anderson-darling",
}

QQ_PLOT_TESTS = {
    "shapiro-wilk",
    "kolmogorov-smirnov",
    "anderson-darling",
    "one-sample-ttest",
}

SCATTER_TESTS = {
    "pearson-correlation",
    "spearman-correlation",
    "kendall-correlation",
    "partial-correlation",
}


def enrich_chart_data(
    test_id: str,
    df: pd.DataFrame,
    response: AnalysisResponse,
    options: dict | None = None,
) -> AnalysisResponse:
    options = options or {}
    chart_data: dict[str, Any] = dict(response.chart_data or {})

    try:
        if "group_means" not in chart_data and test_id in GROUP_COMPARISON_TESTS:
            chart_data["group_means"] = build_group_means_chart(df, options)

        if "histogram" not in chart_data and test_id in HISTOGRAM_TESTS:
            arr = first_numeric(df, options).to_numpy()
            bins = min(10, max(3, len(arr) // 2))
            chart_data["histogram"] = histogram_bins(arr, bins)

        if "histogram" not in chart_data and test_id in {"histogram", "box-plot"}:
            arr = first_numeric(df, options).to_numpy()
            chart_data["histogram"] = histogram_bins(arr, int(10))

        if "frequency" not in chart_data and test_id == "frequency-table":
            col = categorical_columns(df)[0] if categorical_columns(df) else numeric_columns(df)[0]
            counts = df[col].value_counts()
            chart_data["frequency"] = [
                {"label": str(label), "count": int(count)}
                for label, count in counts.items()
            ]

        if "scatter" not in chart_data and test_id in SCATTER_TESTS:
            chart_data["scatter"] = build_scatter_chart(df, options)

        if test_id == "paired-ttest" and "group_means" not in chart_data:
            x, y = aligned_two_numeric(df, options)
            cols = numeric_columns(df)
            chart_data["group_means"] = [
                {
                    "group": cols[0],
                    "mean": round(float(x.mean()), 2),
                    "sd": round(float(x.std(ddof=1)), 2),
                },
                {
                    "group": cols[1],
                    "mean": round(float(y.mean()), 2),
                    "sd": round(float(y.std(ddof=1)), 2),
                },
            ]

        if test_id == "wilcoxon-signed-rank" and "group_means" not in chart_data:
            x, y = aligned_two_numeric(df, options)
            cols = numeric_columns(df)
            chart_data["group_means"] = [
                {
                    "group": cols[0],
                    "mean": round(float(x.median()), 2),
                    "sd": round(float(x.std(ddof=1)), 2),
                },
                {
                    "group": cols[1],
                    "mean": round(float(y.median()), 2),
                    "sd": round(float(y.std(ddof=1)), 2),
                },
            ]

        if test_id in {"repeated-measures-anova", "friedman"} and "group_means" not in chart_data:
            cols = numeric_columns(df)
            chart_data["group_means"] = [
                {
                    "group": col,
                    "mean": round(float(df[col].mean()), 2),
                    "sd": round(float(df[col].std(ddof=1)), 2),
                }
                for col in cols
            ]

        if test_id == "multiple-regression" and "scatter" not in chart_data:
            cols = numeric_columns(df)
            if len(cols) >= 2:
                subset = df[cols[:2]].dropna()
                chart_data["scatter"] = [
                    {"x": float(row[cols[1]]), "y": float(row[cols[0]])}
                    for _, row in subset.iterrows()
                ]

        if test_id == "polynomial-regression" and "scatter" not in chart_data:
            chart_data["scatter"] = build_scatter_chart(df, options)

        if test_id == "chi-square" and "frequency" not in chart_data:
            row, col = two_categorical(df, options)
            table = pd.crosstab(row, col)
            chart_data["frequency"] = [
                {"label": f"{r} × {c}", "count": int(table.loc[r, c])}
                for r in table.index
                for c in table.columns
            ]

        if test_id == "point-biserial" and "scatter" not in chart_data:
            num_cols = numeric_columns(df)
            cat_cols = categorical_columns(df)
            if num_cols and cat_cols:
                subset = df[[num_cols[0], cat_cols[0]]].dropna()
                chart_data["scatter"] = [
                    {"x": float(i), "y": float(val)}
                    for i, val in enumerate(subset[num_cols[0]].astype(float))
                ]

        if test_id == "cluster-analysis" and "frequency" not in chart_data:
            cols = numeric_columns(df)
            if len(cols) >= 2:
                from sklearn.cluster import KMeans
                from sklearn.preprocessing import StandardScaler

                data = StandardScaler().fit_transform(df[cols].dropna())
                k = min(3, len(data))
                labels = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(data)
                counts = pd.Series(labels).value_counts().sort_index()
                chart_data["frequency"] = [
                    {"label": f"Cluster {i}", "count": int(c)} for i, c in counts.items()
                ]

        if "qq_plot" not in chart_data and test_id in QQ_PLOT_TESTS:
            series = first_numeric(df, options)
            arr = series.to_numpy()
            qq_points = build_qq_plot(arr)
            if qq_points:
                chart_data["qq_plot"] = qq_points

        if "downloads" not in chart_data and test_id in QQ_PLOT_TESTS:
            series = first_numeric(df, options)
            arr = series.to_numpy()
            variable_name = str(
                response.variable_name
                or options.get("value_column")
                or series.name
                or "variable"
            )
            downloads: list[dict[str, str]] = []
            append_download(
                downloads,
                "Variable data",
                f"{test_id}-{variable_name}.csv",
                build_variable_csv(arr, variable_name),
            )
            qq_points = chart_data.get("qq_plot") or build_qq_plot(arr)
            if qq_points:
                append_download(
                    downloads,
                    "Q-Q plot data",
                    f"{test_id}-{variable_name}-qq.csv",
                    build_qq_csv(qq_points, variable_name),
                )
            try:
                normalized_csv, normalized_name = build_normalized_variable_csv(df, options)
                append_download(
                    downloads,
                    "Normalized data",
                    f"{test_id}-{normalized_name}-normalized.csv",
                    normalized_csv,
                )
            except DataValidationError:
                pass
            if downloads:
                chart_data["downloads"] = downloads
    except (DataValidationError, ValueError, KeyError):
        pass

    if chart_data:
        response.chart_data = chart_data
    return response
