from __future__ import annotations

import re
from typing import Any, Callable

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.decomposition import FactorAnalysis
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import cohen_kappa_score, roc_auc_score, roc_curve
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
import statsmodels.api as sm
from statsmodels.formula.api import ols
from statsmodels.stats.anova import AnovaRM
from statsmodels.stats.contingency_tables import mcnemar as mcnemar_test
from statsmodels.stats.power import TTestIndPower

from app.core.exceptions import DataValidationError, TestNotFoundError
from app.schemas.common import AnalysisResponse, StatResult
from app.services.column_utils import (
    aligned_two_numeric,
    categorical_columns,
    first_numeric,
    format_p,
    groups_from_column,
    numeric_at,
    numeric_columns,
    resolve_numeric_column,
    resolve_value_columns,
    significance_badge,
    two_categorical,
    two_numeric,
    value_and_group,
    predictors_and_binary_outcome,
)
from app.services.classification_models import classification_models
from app.services.regression_models import regression_models
from app.services.time_series_models import time_series_models
from app.utils.data_parser import parse_csv
from app.services.chart_helpers import build_qq_plot, enrich_chart_data, histogram_bins
from app.services.ml_preprocessing import METHOD_LABELS, apply_feature_method


def _response(
    test_id: str,
    title: str,
    stats: list[StatResult],
    interpretation: str,
    apa_output: str | None = None,
    chart_data: dict[str, Any] | None = None,
) -> AnalysisResponse:
    return AnalysisResponse(
        test_id=test_id,
        title=title,
        stats=stats,
        interpretation=interpretation,
        apa_output=apa_output,
        chart_data=chart_data,
    )


# ── Descriptive ──────────────────────────────────────────────────────────────


def _parse_summary_metrics(raw: list | None) -> list[str]:
    valid_metrics = {
        "n",
        "mean",
        "median",
        "mode",
        "sum",
        "std",
        "variance",
        "sem",
        "cv",
        "min",
        "max",
        "range",
        "q1",
        "q3",
        "iqr",
        "p10",
        "p90",
        "p95",
        "p99",
        "skewness",
        "kurtosis",
    }
    if raw is None:
        return ["mean", "std", "min", "max"]
    if not isinstance(raw, list):
        raise DataValidationError("requested_metrics must be a list")

    requested: list[str] = []
    for item in raw:
        key = str(item).lower().strip()
        if key in valid_metrics and key not in requested:
            requested.append(key)
            continue
        match = re.fullmatch(r"p(\d+)", key)
        if match:
            rank = int(match.group(1))
            if 1 <= rank <= 99 and key not in requested:
                requested.append(key)
    if not requested:
        raise DataValidationError("Select at least one metric to calculate")
    return requested


def _percentile_rank(metric_key: str) -> int | None:
    mapping = {
        "q1": 25,
        "median": 50,
        "q3": 75,
        "p10": 10,
        "p90": 90,
        "p95": 95,
        "p99": 99,
    }
    if metric_key in mapping:
        return mapping[metric_key]
    match = re.fullmatch(r"p(\d+)", metric_key)
    if match:
        return int(match.group(1))
    return None


def _percentile_ranks_from_options(options: dict) -> list[int]:
    requested_percentiles = options.get("requested_percentiles")
    if requested_percentiles:
        return sorted(
            {int(rank) for rank in requested_percentiles if 1 <= int(rank) <= 99}
        )

    raw_metrics = options.get("requested_metrics")
    if raw_metrics:
        parsed = _parse_summary_metrics(raw_metrics)
        ranks = sorted(
            {
                rank
                for key in parsed
                if (rank := _percentile_rank(key)) is not None
            }
        )
        if ranks:
            return ranks

    return [10, 25, 50, 75, 90, 95, 99]


def _resolve_value_col_for_item(
    item: AnalysisResponse,
    options: dict,
    index: int,
) -> str | None:
    if item.variable_name:
        name = str(item.variable_name)
        if "|" in name:
            name = name.split("|")[-1]
        return name

    value_columns = options.get("value_columns")
    if isinstance(value_columns, list) and index < len(value_columns):
        return str(value_columns[index])

    value_col = options.get("value_column")
    return str(value_col) if value_col else None


def _enrich_with_summary_metrics(
    test_id: str,
    df: pd.DataFrame,
    options: dict,
    result: AnalysisResponse,
) -> AnalysisResponse:
    if test_id == "summary-statistics":
        return result

    raw = options.get("requested_metrics")
    if not raw:
        return result

    try:
        requested = _parse_summary_metrics(raw)
    except DataValidationError:
        return result

    def enrich_item(item: AnalysisResponse, value_col: str | None) -> AnalysisResponse:
        if not value_col or value_col not in df.columns:
            return item
        arr = pd.to_numeric(df[value_col], errors="coerce").dropna().to_numpy(dtype=float)
        if len(arr) == 0:
            return item
        summary = _summary_stats_for_array(arr, requested, options, title=item.title)
        existing = {stat.label for stat in item.stats}
        item.stats = item.stats + [
            stat for stat in summary.stats if stat.label not in existing
        ]
        return item

    if result.batch_results:
        result.batch_results = [
            enrich_item(item, _resolve_value_col_for_item(item, options, index))
            for index, item in enumerate(result.batch_results)
        ]
        return result

    value_col = _resolve_value_col_for_item(result, options, 0)
    if not value_col:
        try:
            cols = resolve_value_columns(df, options)
            value_col = cols[0] if cols else None
        except DataValidationError:
            value_col = None

    return enrich_item(result, value_col)


def _summary_stats_for_array(
    arr: np.ndarray,
    requested: list[str],
    options: dict,
    *,
    title: str = "Summary Statistics",
    segment_label: str | None = None,
) -> AnalysisResponse:
    if len(arr) == 0:
        raise DataValidationError("No numeric values found for summary statistics")

    n = len(arr)
    std_val = float(arr.std(ddof=1))
    mean_val = float(arr.mean())

    needed_percentiles = {
        rank
        for key in requested
        if (rank := _percentile_rank(key)) is not None
    }
    if "iqr" in requested:
        needed_percentiles.update({25, 75})

    percentile_values: dict[int, float] = {}
    if needed_percentiles:
        ranks = sorted(needed_percentiles)
        computed = np.percentile(arr, ranks)
        percentile_values = {rank: float(value) for rank, value in zip(ranks, computed, strict=True)}

    q1 = percentile_values.get(25)
    q2 = percentile_values.get(50)
    q3 = percentile_values.get(75)

    mode_val: float | None = None
    if "mode" in requested:
        mode_result = stats.mode(arr, keepdims=True)
        mode_val = float(mode_result.mode[0]) if len(mode_result.mode) else float("nan")

    label_map = {
        "n": "N",
        "mean": "Mean",
        "median": "Median",
        "mode": "Mode",
        "sum": "Sum",
        "std": "Std. Deviation",
        "variance": "Variance",
        "sem": "Std. Error (SEM)",
        "cv": "Coefficient of Variation",
        "min": "Minimum",
        "max": "Maximum",
        "range": "Range",
        "q1": "Q1",
        "q3": "Q3",
        "iqr": "IQR",
        "p10": "10th Percentile",
        "p90": "90th Percentile",
        "p95": "95th Percentile",
        "p99": "99th Percentile",
        "skewness": "Skewness",
        "kurtosis": "Kurtosis",
    }

    def pct_result(key: str, rank: int) -> StatResult:
        label = label_map.get(key, f"{rank}th Percentile")
        return StatResult(label=label, value=f"{percentile_values[rank]:.4f}")

    calculators: dict[str, Callable[[], StatResult]] = {
        "n": lambda: StatResult(label=label_map["n"], value=str(n)),
        "mean": lambda: StatResult(label=label_map["mean"], value=f"{mean_val:.4f}"),
        "median": lambda: pct_result("median", 50),
        "mode": lambda: StatResult(label=label_map["mode"], value=f"{mode_val:.4f}"),
        "sum": lambda: StatResult(label=label_map["sum"], value=f"{arr.sum():.4f}"),
        "std": lambda: StatResult(label=label_map["std"], value=f"{std_val:.4f}"),
        "variance": lambda: StatResult(label=label_map["variance"], value=f"{arr.var(ddof=1):.4f}"),
        "sem": lambda: StatResult(
            label=label_map["sem"],
            value=f"{(std_val / np.sqrt(n)):.4f}" if n > 0 else "nan",
        ),
        "cv": lambda: StatResult(
            label=label_map["cv"],
            value=f"{(std_val / mean_val) * 100:.4f}" if mean_val != 0 else "nan",
        ),
        "min": lambda: StatResult(label=label_map["min"], value=f"{arr.min():.4f}"),
        "max": lambda: StatResult(label=label_map["max"], value=f"{arr.max():.4f}"),
        "range": lambda: StatResult(
            label=label_map["range"],
            value=f"{arr.max() - arr.min():.4f}",
        ),
        "q1": lambda: pct_result("q1", 25),
        "q3": lambda: pct_result("q3", 75),
        "iqr": lambda: StatResult(
            label=label_map["iqr"],
            value=f"{(q3 - q1):.4f}" if q1 is not None and q3 is not None else "nan",
        ),
        "p10": lambda: pct_result("p10", 10),
        "p90": lambda: pct_result("p90", 90),
        "p95": lambda: pct_result("p95", 95),
        "p99": lambda: pct_result("p99", 99),
        "skewness": lambda: StatResult(
            label=label_map["skewness"],
            value=f"{float(stats.skew(arr, bias=False)):.4f}",
        ),
        "kurtosis": lambda: StatResult(
            label=label_map["kurtosis"],
            value=f"{float(stats.kurtosis(arr, bias=False)):.4f}",
        ),
    }

    for key in requested:
        rank = _percentile_rank(key)
        if rank is not None and key not in calculators:
            calculators[key] = lambda k=key, r=rank: pct_result(k, r)

    stats_list = [calculators[metric]() for metric in requested if metric in calculators]

    ci_options = options.get("confidence_interval") or {}
    if (
        isinstance(ci_options, dict)
        and ci_options.get("enabled")
        and "mean" in requested
        and n > 1
    ):
        level = int(ci_options.get("level", 95))
        if level not in {90, 95, 99}:
            level = 95
        alpha = 1 - level / 100
        t_crit = float(stats.t.ppf(1 - alpha / 2, df=n - 1))
        margin = t_crit * std_val / np.sqrt(n)
        lower = mean_val - margin
        upper = mean_val + margin
        stats_list.append(
            StatResult(
                label=f"Mean CI ({level}%)",
                value=f"[{lower:.4f}, {upper:.4f}]",
            )
        )

    interpretation_parts: list[str] = [f"N = {n}"]
    if segment_label:
        interpretation_parts.insert(0, f"Group = {segment_label}")
    if "mean" in requested:
        interpretation_parts.append(f"M = {mean_val:.2f}")
    if "std" in requested:
        interpretation_parts.append(f"SD = {std_val:.2f}")
    if "median" in requested and q2 is not None:
        interpretation_parts.append(f"Mdn = {q2:.2f}")
    if "min" in requested:
        interpretation_parts.append(f"Min = {arr.min():.2f}")
    if "max" in requested:
        interpretation_parts.append(f"Max = {arr.max():.2f}")

    return AnalysisResponse(
        test_id="summary-statistics",
        title=title,
        stats=stats_list,
        interpretation=", ".join(interpretation_parts) + ".",
        variable_name=segment_label,
    )


def summary_statistics(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    requested = _parse_summary_metrics(options.get("requested_metrics"))
    value_col = resolve_value_columns(df, options)[0]
    group_col = options.get("group_column")

    if group_col and str(group_col) in df.columns:
        group_name = str(group_col)
        subset = df[[value_col, group_name]].dropna()
        groups = sorted(subset[group_name].astype(str).unique().tolist())
        if len(groups) < 1:
            raise DataValidationError("Group column has no usable categories")

        batch: list[AnalysisResponse] = []
        for group in groups:
            arr = pd.to_numeric(subset[subset[group_name] == group][value_col], errors="coerce")
            arr = arr.dropna().to_numpy(dtype=float)
            if len(arr) == 0:
                continue
            batch.append(
                _summary_stats_for_array(
                    arr,
                    requested,
                    options,
                    title=f"Summary Statistics — {group}",
                    segment_label=group,
                )
            )

        if not batch:
            raise DataValidationError("No numeric values found in any group")

        return AnalysisResponse(
            test_id="summary-statistics",
            title=f"Summary Statistics by {group_name} ({len(batch)} groups)",
            stats=[],
            interpretation=(
                f"Summary statistics segmented by {group_name} across {len(batch)} group(s)."
            ),
            batch_results=batch,
        )

    arr = pd.to_numeric(df[value_col], errors="coerce").dropna().to_numpy(dtype=float)
    return _summary_stats_for_array(arr, requested, options)


def frequency_table(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    col = options.get("variable_column") or options.get("value_column")
    if col and str(col) in df.columns:
        target = str(col)
    elif categorical_columns(df):
        target = categorical_columns(df)[0]
    else:
        target = numeric_columns(df)[0]
    counts = df[target].value_counts()
    total = len(df[target].dropna())
    stats_list = [
        StatResult(label=str(idx), value=f"{count} ({count / total * 100:.1f}%)")
        for idx, count in counts.items()
    ]
    return _response(
        "frequency-table",
        "Frequency Table",
        stats_list[:12],
        f"Frequency distribution for '{target}' across {total} observations.",
    )


def cross_tabulation(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    row, col = two_categorical(df, options)
    table = pd.crosstab(row, col)
    stats_list = [
        StatResult(label=f"{r} × {c}", value=str(table.loc[r, c]))
        for r in table.index
        for c in table.columns
    ]
    return _response(
        "cross-tabulation",
        "Cross Tabulation",
        stats_list[:20],
        f"Contingency table with {table.shape[0]} rows and {table.shape[1]} columns.",
        chart_data={"table": table.to_dict()},
    )


def _histogram_bins(arr: np.ndarray, bins: int) -> list[dict[str, str | int]]:
    return histogram_bins(arr, bins)


def histogram(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    arr = first_numeric(df, options).to_numpy()
    bins = int(options.get("bins", 10))
    chart = _histogram_bins(arr, bins)
    return _response(
        "histogram",
        "Histogram",
        [
            StatResult(label="N", value=str(len(arr))),
            StatResult(label="Bins", value=str(bins)),
            StatResult(label="Mean", value=f"{arr.mean():.4f}"),
            StatResult(label="Std. Dev.", value=f"{arr.std(ddof=1):.4f}"),
        ],
        f"Distribution of {len(arr)} values across {bins} bins.",
        chart_data={"histogram": chart},
    )


def box_plot(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    arr = first_numeric(df, options).to_numpy()
    bins = int(options.get("bins", 10))
    q1, med, q3 = np.percentile(arr, [25, 50, 75])
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    outliers = arr[(arr < lower) | (arr > upper)]
    return _response(
        "box-plot",
        "Box Plot",
        [
            StatResult(label="Min", value=f"{arr.min():.4f}"),
            StatResult(label="Q1", value=f"{q1:.4f}"),
            StatResult(label="Median", value=f"{med:.4f}"),
            StatResult(label="Q3", value=f"{q3:.4f}"),
            StatResult(label="Max", value=f"{arr.max():.4f}"),
            StatResult(label="IQR", value=f"{iqr:.4f}"),
            StatResult(label="Outliers", value=str(len(outliers))),
        ],
        f"Five-number summary with {len(outliers)} outlier(s) detected.",
        chart_data={"histogram": _histogram_bins(arr, bins)},
    )


def percentiles(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    arr = first_numeric(df, options).to_numpy()
    percentile_ranks = _percentile_ranks_from_options(options)
    if not percentile_ranks:
        raise DataValidationError("Select at least one valid percentile (1–99)")

    values = np.percentile(arr, percentile_ranks)
    stats_list = [
        StatResult(label=f"P{p}", value=f"{v:.4f}")
        for p, v in zip(percentile_ranks, values, strict=True)
    ]
    if 25 in percentile_ranks and 75 in percentile_ranks:
        q1 = float(np.percentile(arr, 25))
        q3 = float(np.percentile(arr, 75))
        stats_list.append(StatResult(label="IQR", value=f"{q3 - q1:.4f}"))

    return _response(
        "percentiles",
        "Percentiles & Quartiles",
        stats_list,
        f"Percentile profile for N = {len(arr)}.",
    )


# ── Hypothesis ───────────────────────────────────────────────────────────────


def one_sample_ttest(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    arr = first_numeric(df, options).to_numpy()
    pop_mean = float(options.get("population_mean", 0))
    result = stats.ttest_1samp(arr, pop_mean)
    p = float(result.pvalue)
    return _response(
        "one-sample-ttest",
        "One-Sample t-Test",
        [
            StatResult(label="t-statistic", value=f"{float(result.statistic):.4f}"),
            StatResult(label="df", value=str(len(arr) - 1)),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="Sample mean", value=f"{arr.mean():.4f}"),
            StatResult(label="Population mean (H₀)", value=f"{pop_mean:.4f}"),
        ],
        f"Sample mean ({arr.mean():.2f}) vs population mean ({pop_mean:.2f}), p = {format_p(p)}.",
    )


def independent_ttest(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    values, groups = value_and_group(df, options)
    grouped = groups_from_column(values, groups)
    keys = list(grouped.keys())
    a = np.array(grouped[keys[0]])
    b = np.array(grouped[keys[1]])
    equal_var = bool(options.get("equal_var", True))
    result = stats.ttest_ind(a, b, equal_var=equal_var)
    p = float(result.pvalue)
    df_val = len(a) + len(b) - 2
    pooled = np.sqrt(((len(a) - 1) * a.var(ddof=1) + (len(b) - 1) * b.var(ddof=1)) / df_val)
    d = (a.mean() - b.mean()) / pooled if pooled else 0.0
    chart_data = {
        "group_means": [
            {"group": keys[0], "mean": round(float(a.mean()), 2), "sd": round(float(a.std(ddof=1)), 2)},
            {"group": keys[1], "mean": round(float(b.mean()), 2), "sd": round(float(b.std(ddof=1)), 2)},
        ]
    }
    return _response(
        "independent-ttest",
        "Independent Samples t-Test",
        [
            StatResult(label="t-statistic", value=f"{float(result.statistic):.4f}"),
            StatResult(label="df", value=str(int(df_val))),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="Cohen's d", value=f"{d:.4f}"),
            StatResult(label=f"Mean {keys[0]}", value=f"{a.mean():.4f}"),
            StatResult(label=f"Mean {keys[1]}", value=f"{b.mean():.4f}"),
        ],
        f"{keys[0]} (M={a.mean():.2f}) vs {keys[1]} (M={b.mean():.2f}), p = {format_p(p)}, d = {d:.2f}.",
        apa_output=(
            f"Independent-samples t-test: {keys[0]} (M = {a.mean():.2f}, SD = {a.std(ddof=1):.2f}) "
            f"vs {keys[1]} (M = {b.mean():.2f}, SD = {b.std(ddof=1):.2f}), "
            f"t({int(df_val)}) = {float(result.statistic):.2f}, p = {format_p(p)}, d = {d:.2f}."
        ),
        chart_data=chart_data,
    )


def paired_ttest(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    x, y = aligned_two_numeric(df, options)
    result = stats.ttest_rel(x, y)
    p = float(result.pvalue)
    diff = x - y
    d = diff.mean() / diff.std(ddof=1) if diff.std(ddof=1) else 0.0
    return _response(
        "paired-ttest",
        "Paired Samples t-Test",
        [
            StatResult(label="t-statistic", value=f"{float(result.statistic):.4f}"),
            StatResult(label="df", value=str(len(x) - 1)),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="Mean difference", value=f"{diff.mean():.4f}"),
            StatResult(label="Cohen's d", value=f"{d:.4f}"),
        ],
        f"Paired comparison: mean difference = {diff.mean():.2f}, p = {format_p(p)}.",
    )


def one_way_anova(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    samples, group_labels, design_note = _one_way_anova_samples(df, options)
    _validate_one_way_samples(samples)

    result = stats.f_oneway(*samples)
    f_val = float(result.statistic)
    p = float(result.pvalue)
    if not np.isfinite(f_val) or not np.isfinite(p):
        raise DataValidationError(
            "Cannot compute one-way ANOVA for this data. Add more observations per "
            "group and ensure the dependent variable varies within groups."
        )

    return _response(
        "one-way-anova",
        "One-Way ANOVA",
        [
            StatResult(label="F-statistic", value=f"{f_val:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="Groups", value=str(len(samples))),
            StatResult(label="Total N", value=str(sum(len(s) for s in samples))),
            StatResult(label="Group labels", value=", ".join(group_labels)),
        ],
        (
            f"One-way ANOVA across {len(samples)} groups ({design_note}), "
            f"p = {format_p(p)}."
        ),
    )


def _wide_anova_samples(
    df: pd.DataFrame, value_cols: list[str]
) -> tuple[list[np.ndarray], list[str]]:
    samples: list[np.ndarray] = []
    labels: list[str] = []
    for col in value_cols:
        if col not in df.columns:
            continue
        arr = pd.to_numeric(df[col], errors="coerce").dropna().to_numpy(dtype=float)
        if len(arr) > 0:
            samples.append(arr)
            labels.append(str(col))
    return samples, labels


def _one_way_single_observation_error(
    grouped: dict[str, list[float]], group_col: str
) -> DataValidationError:
    counts = {name: len(values) for name, values in grouped.items()}
    preview = ", ".join(f"{name} (n={size})" for name, size in sorted(counts.items())[:8])
    if len(counts) > 8:
        preview += f", ... ({len(counts)} groups total)"

    hint = ""
    if len(counts) >= 3 and all(size == 1 for size in counts.values()):
        hint = (
            f' Column "{group_col}" looks like an ID or unique label (one row per category). '
            "Choose a group column with repeated values (e.g. Treatment = A, B, C), "
            "or select 2+ numeric columns in wide format (each column = one group)."
        )

    return DataValidationError(
        "One-way ANOVA needs at least 2 observations in one or more groups. "
        f"Current group sizes: {preview}.{hint}"
    )


def _one_way_anova_samples(
    df: pd.DataFrame, options: dict
) -> tuple[list[np.ndarray], list[str], str]:
    value_cols = resolve_value_columns(
        df,
        options,
        keys=("value_columns", "value_column", "y_column"),
    )
    group_col = options.get("group_column")

    if group_col and str(group_col) in df.columns:
        long_opts = {**options, "value_column": value_cols[0]}
        values, groups = value_and_group(df, long_opts)
        grouped = groups_from_column(values, groups)
        long_samples = [np.array(v) for v in grouped.values()]
        long_labels = list(grouped.keys())

        if not all(len(sample) < 2 for sample in long_samples):
            return (
                long_samples,
                long_labels,
                f"long format by {group_col}",
            )

        if len(value_cols) >= 2:
            wide_samples, wide_labels = _wide_anova_samples(df, value_cols)
            if len(wide_samples) >= 2 and not all(len(sample) < 2 for sample in wide_samples):
                return (
                    wide_samples,
                    wide_labels,
                    "wide format (each selected column is a group)",
                )

        raise _one_way_single_observation_error(grouped, str(group_col))

    if len(value_cols) >= 2:
        wide_samples, wide_labels = _wide_anova_samples(df, value_cols)
        if len(wide_samples) < 2:
            raise DataValidationError(
                "Select at least 2 numeric columns for wide-format one-way ANOVA."
            )
        return (
            wide_samples,
            wide_labels,
            "wide format (each selected column is a group)",
        )

    raise DataValidationError(
        "One-way ANOVA needs either a group column with repeated categories (long format) "
        "or 2+ numeric columns where each column is a group (wide format)."
    )


def _validate_one_way_samples(samples: list[np.ndarray]) -> None:
    if all(len(sample) < 2 for sample in samples):
        sizes = ", ".join(f"group {idx + 1} (n={len(sample)})" for idx, sample in enumerate(samples))
        raise DataValidationError(
            "One-way ANOVA needs at least 2 observations in one or more groups. "
            f"Current group sizes: {sizes}."
        )

    within_df = sum(len(sample) - 1 for sample in samples)
    if within_df < 1:
        raise DataValidationError(
            "One-way ANOVA cannot estimate within-group variance for this data."
        )

    within_ss = sum(
        float(np.var(sample, ddof=1)) * (len(sample) - 1)
        for sample in samples
        if len(sample) > 1
    )
    if within_ss <= 0:
        raise DataValidationError(
            "Cannot compute F-statistic: values are identical within every group."
        )


def _type2_two_way_anova_effects(work: pd.DataFrame) -> list[tuple[str, float, float]]:
    """Type II two-way ANOVA via nested OLS models. Returns (effect, F, p)."""
    full_formula = "y ~ C(factor_a) + C(factor_b) + C(factor_a):C(factor_b)"
    additive_formula = "y ~ C(factor_a) + C(factor_b)"

    model_full = ols(full_formula, data=work).fit()
    if model_full.df_resid < 1:
        raise DataValidationError(
            "Two-way ANOVA needs replicate observations (more rows than factor "
            "combinations). With only one row per A×B cell, error variance cannot be "
            "estimated and F/p values are undefined. Add extra measurements in at "
            "least one combination."
        )

    ms_error = model_full.ssr / model_full.df_resid
    if not np.isfinite(ms_error) or ms_error <= 0:
        raise DataValidationError(
            "Cannot estimate error variance: the dependent variable does not vary "
            "within factor groups. Add replicate measurements or check your data."
        )

    levels_a = int(work["factor_a"].nunique())
    levels_b = int(work["factor_b"].nunique())
    df_a = levels_a - 1
    df_b = levels_b - 1
    df_ab = df_a * df_b
    df_error = int(model_full.df_resid)

    sse_additive = float(ols(additive_formula, data=work).fit().ssr)
    ss_a = float(ols("y ~ C(factor_b)", data=work).fit().ssr) - sse_additive
    ss_b = float(ols("y ~ C(factor_a)", data=work).fit().ssr) - sse_additive
    ss_ab = sse_additive - float(model_full.ssr)

    effects: list[tuple[str, float, float]] = []
    for key, ss, df in [
        ("C(factor_a)", ss_a, df_a),
        ("C(factor_b)", ss_b, df_b),
        ("C(factor_a):C(factor_b)", ss_ab, df_ab),
    ]:
        if df <= 0:
            continue
        f_stat = (ss / df) / ms_error
        if not np.isfinite(f_stat):
            raise DataValidationError(
                "Cannot compute two-way ANOVA for this design. Ensure the dependent "
                "variable varies within groups and add replicate observations."
            )
        p_value = float(stats.f.sf(f_stat, df, df_error))
        effects.append((key, float(f_stat), p_value))

    return effects


def two_way_anova(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    num_cols = numeric_columns(df)
    cat_cols = categorical_columns(df)

    y_col = str(
        options.get("y_column")
        or options.get("value_column")
        or (num_cols[0] if num_cols else "")
    )
    factor_a_col = str(
        options.get("factor_a_column")
        or options.get("row_column")
        or (cat_cols[0] if len(cat_cols) > 0 else "")
    )
    factor_b_col = str(
        options.get("factor_b_column")
        or options.get("col_column")
        or (cat_cols[1] if len(cat_cols) > 1 else "")
    )

    if not y_col or y_col not in df.columns:
        raise DataValidationError(
            "Select a numeric dependent variable for two-way ANOVA."
        )
    if not factor_a_col or factor_a_col not in df.columns:
        raise DataValidationError("Select factor A (categorical column).")
    if not factor_b_col or factor_b_col not in df.columns:
        raise DataValidationError("Select factor B (categorical column).")
    if factor_a_col == factor_b_col:
        raise DataValidationError("Factor A and factor B must be different columns.")
    if factor_a_col == y_col or factor_b_col == y_col:
        raise DataValidationError("Factors must be categorical and different from the dependent variable.")

    work = df[[y_col, factor_a_col, factor_b_col]].dropna().copy()
    work.columns = ["y", "factor_a", "factor_b"]
    work["factor_a"] = work["factor_a"].astype(str)
    work["factor_b"] = work["factor_b"].astype(str)

    if len(work) < 4:
        raise DataValidationError(
            "Two-way ANOVA needs at least 4 complete rows after removing missing values."
        )

    levels_a = work["factor_a"].nunique()
    levels_b = work["factor_b"].nunique()
    if levels_a < 2:
        raise DataValidationError(
            f'Factor A "{factor_a_col}" must have at least 2 different categories.'
        )
    if levels_b < 2:
        raise DataValidationError(
            f'Factor B "{factor_b_col}" must have at least 2 different categories.'
        )

    observed_cells = work.groupby(["factor_a", "factor_b"], observed=True).size()
    expected_cells = levels_a * levels_b
    if len(observed_cells) < expected_cells:
        raise DataValidationError(
            "Two-way ANOVA requires at least one observation in every factor combination. "
            "Some A × B groups are missing from your data — add rows for the missing "
            "combinations or choose different factors."
        )
    if len(work) <= expected_cells:
        raise DataValidationError(
            "Two-way ANOVA needs replicate observations (more rows than factor "
            "combinations). With only one row per A×B cell, error variance cannot be "
            "estimated and F/p values are undefined. Add extra measurements in at "
            "least one combination."
        )

    try:
        effects = _type2_two_way_anova_effects(work)
    except DataValidationError:
        raise
    except Exception as exc:
        raise DataValidationError(
            "Cannot compute two-way ANOVA for this design. Ensure both factors have at "
            "least two levels, every factor combination has data, and the dependent "
            "variable varies within groups."
        ) from exc

    label_map = {
        "C(factor_a)": f"Factor A ({factor_a_col})",
        "C(factor_b)": f"Factor B ({factor_b_col})",
        "C(factor_a):C(factor_b)": f"Interaction ({factor_a_col} × {factor_b_col})",
    }
    stats_list = []
    for effect_key, f_stat, p_value in effects:
        stats_list.append(
            StatResult(
                label=label_map.get(effect_key, effect_key),
                value=f"F={f_stat:.4f}, p={format_p(p_value)}",
                badge=significance_badge(p_value),
            )
        )

    return _response(
        "two-way-anova",
        "Two-Way ANOVA",
        stats_list,
        (
            f"Two-way ANOVA for {y_col} by {factor_a_col} and {factor_b_col}, "
            f"including the interaction effect."
        ),
    )


def repeated_measures_anova(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    num_cols = numeric_columns(df)
    if len(num_cols) < 3:
        raise DataValidationError("Need 3+ numeric columns (one per repeated measure)")
    long_rows = []
    for idx, row in df[num_cols].dropna().iterrows():
        for col in num_cols:
            long_rows.append({"subject": idx, "condition": col, "score": row[col]})
    long_df = pd.DataFrame(long_rows)
    result = AnovaRM(long_df, depvar="score", subject="subject", within=["condition"]).fit()
    p = float(result.anova_table.loc["condition", "Pr > F"])
    f_val = float(result.anova_table.loc["condition", "F Value"])
    return _response(
        "repeated-measures-anova",
        "Repeated Measures ANOVA",
        [
            StatResult(label="F-statistic", value=f"{f_val:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="Conditions", value=str(len(num_cols))),
        ],
        f"Repeated measures ANOVA across {len(num_cols)} conditions, p = {format_p(p)}.",
    )


def chi_square(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    row, col = two_categorical(df, options)
    table = pd.crosstab(row, col)
    chi2, p, dof, _ = stats.chi2_contingency(table)
    return _response(
        "chi-square",
        "Chi-Square Test",
        [
            StatResult(label="χ²", value=f"{chi2:.4f}"),
            StatResult(label="df", value=str(int(dof))),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Chi-square test of association, χ²({int(dof)}) = {chi2:.2f}, p = {format_p(p)}.",
    )


def fishers_exact(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    row, col = two_categorical(df, options)
    table = pd.crosstab(row, col)
    if table.shape != (2, 2):
        raise DataValidationError("Fisher's exact test requires a 2×2 table")
    odds, p = stats.fisher_exact(table.to_numpy())
    return _response(
        "fishers-exact",
        "Fisher's Exact Test",
        [
            StatResult(label="Odds ratio", value=f"{odds:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Fisher's exact test, OR = {odds:.2f}, p = {format_p(p)}.",
    )


def mann_whitney(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    values, groups = value_and_group(df, options)
    grouped = groups_from_column(values, groups)
    keys = list(grouped.keys())
    result = stats.mannwhitneyu(grouped[keys[0]], grouped[keys[1]], alternative="two-sided")
    p = float(result.pvalue)
    return _response(
        "mann-whitney",
        "Mann-Whitney U Test",
        [
            StatResult(label="U-statistic", value=f"{float(result.statistic):.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Mann-Whitney U comparing {keys[0]} vs {keys[1]}, p = {format_p(p)}.",
    )


def wilcoxon_signed_rank(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    x, y = aligned_two_numeric(df, options)
    result = stats.wilcoxon(x, y)
    p = float(result.pvalue)
    return _response(
        "wilcoxon-signed-rank",
        "Wilcoxon Signed-Rank Test",
        [
            StatResult(label="W-statistic", value=f"{float(result.statistic):.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Wilcoxon signed-rank test, p = {format_p(p)}.",
    )


def kruskal_wallis(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    values, groups = value_and_group(df, options)
    grouped = groups_from_column(values, groups)
    result = stats.kruskalwallis(*grouped.values())
    p = float(result.pvalue)
    return _response(
        "kruskal-wallis",
        "Kruskal-Wallis Test",
        [
            StatResult(label="H-statistic", value=f"{float(result.statistic):.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="Groups", value=str(len(grouped))),
        ],
        f"Kruskal-Wallis across {len(grouped)} groups, p = {format_p(p)}.",
    )


def friedman(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    num_cols = numeric_columns(df)
    if len(num_cols) < 3:
        raise DataValidationError("Friedman test needs 3+ related numeric columns")
    arrays = [df[c].dropna().to_numpy() for c in num_cols]
    result = stats.friedmanchisquare(*arrays)
    p = float(result.pvalue)
    return _response(
        "friedman",
        "Friedman Test",
        [
            StatResult(label="χ²", value=f"{float(result.statistic):.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="Conditions", value=str(len(num_cols))),
        ],
        f"Friedman test across {len(num_cols)} related conditions, p = {format_p(p)}.",
    )


def mcnemar(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    row, col = two_categorical(df, options)
    table = pd.crosstab(row, col)
    if table.shape != (2, 2):
        raise DataValidationError("McNemar test requires a 2×2 table")
    result = mcnemar_test(table.to_numpy(), exact=False)
    p = float(result.pvalue)
    return _response(
        "mcnemar",
        "McNemar Test",
        [
            StatResult(label="χ²", value=f"{float(result.statistic):.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"McNemar test for paired nominal data, p = {format_p(p)}.",
    )


# ── Regression ───────────────────────────────────────────────────────────────


def linear_regression(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    x, y = aligned_two_numeric(df, options)
    slope, intercept, r, p, _ = stats.linregress(x, y)
    r2 = r**2
    chart_data = {
        "scatter": [{"x": float(a), "y": float(b)} for a, b in zip(x, y, strict=False)],
        "regression_line": [
            {"x": float(x.min()), "y": float(intercept + slope * x.min())},
            {"x": float(x.max()), "y": float(intercept + slope * x.max())},
        ],
    }
    return _response(
        "linear-regression",
        "Linear Regression",
        [
            StatResult(label="R²", value=f"{r2:.4f}"),
            StatResult(label="Slope", value=f"{slope:.4f}"),
            StatResult(label="Intercept", value=f"{intercept:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Linear model: y = {intercept:.2f} + {slope:.2f}x, R² = {r2:.3f}, p = {format_p(p)}.",
        chart_data=chart_data,
    )


def multiple_regression(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    num_cols = numeric_columns(df)
    if len(num_cols) < 3:
        raise DataValidationError("Multiple regression needs 1 dependent + 2+ predictor columns")
    y_col = resolve_numeric_column(df, options, keys=("y_column", "value_column"), index=0)
    selected = options.get("predictor_columns")
    if isinstance(selected, list) and selected:
        x_cols = [str(c) for c in selected if str(c) in num_cols and str(c) != y_col]
    else:
        x_cols = [c for c in num_cols if c != y_col]
    if len(x_cols) < 1:
        raise DataValidationError("Select at least one predictor variable")
    subset = df[[y_col, *x_cols]].dropna()
    X = sm.add_constant(subset[x_cols])
    model = sm.OLS(subset[y_col], X).fit()
    stats_list = [
        StatResult(label="R²", value=f"{model.rsquared:.4f}"),
        StatResult(label="Adj. R²", value=f"{model.rsquared_adj:.4f}"),
        StatResult(label="F-statistic", value=f"{model.fvalue:.4f}"),
        StatResult(label="p-value (model)", value=format_p(float(model.f_pvalue))),
    ]
    for name, coef, pval in zip(X.columns[1:], model.params[1:], model.pvalues[1:], strict=False):
        stats_list.append(StatResult(label=f"β ({name})", value=f"{coef:.4f}, p={format_p(pval)}"))
    return _response(
        "multiple-regression",
        "Multiple Regression",
        stats_list,
        f"Multiple regression with {len(x_cols)} predictors, R² = {model.rsquared:.3f}.",
    )


def logistic_regression(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    X, y_raw, outcome_col, predictor_cols = predictors_and_binary_outcome(df, options)
    y = pd.Categorical(y_raw).codes
    if len(np.unique(y)) != 2:
        raise DataValidationError("Logistic regression needs a binary outcome column")

    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)

    stats_list = [
        StatResult(label="N", value=str(len(X))),
        StatResult(label="Outcome", value=outcome_col),
        StatResult(label="Intercept", value=f"{model.intercept_[0]:.4f}"),
    ]
    for col, coef in zip(predictor_cols, model.coef_[0], strict=True):
        stats_list.append(StatResult(label=f"Coef ({col})", value=f"{coef:.4f}"))

    predictors = ", ".join(predictor_cols)
    return _response(
        "logistic-regression",
        "Logistic Regression",
        stats_list,
        f"Logistic regression: {predictors} → {outcome_col} (binary), N = {len(X)}.",
    )


def polynomial_regression(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    x, y = aligned_two_numeric(df, options)
    degree = int(options.get("degree", 2))
    poly = PolynomialFeatures(degree=degree)
    X = poly.fit_transform(x.to_numpy().reshape(-1, 1))
    model = sm.OLS(y, sm.add_constant(X[:, 1:])).fit()
    return _response(
        "polynomial-regression",
        "Polynomial Regression",
        [
            StatResult(label="Degree", value=str(degree)),
            StatResult(label="R²", value=f"{model.rsquared:.4f}"),
            StatResult(label="Adj. R²", value=f"{model.rsquared_adj:.4f}"),
        ],
        f"Polynomial regression (degree {degree}), R² = {model.rsquared:.3f}.",
    )


def ridge_regression(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    num_cols = numeric_columns(df)
    if len(num_cols) < 2:
        raise DataValidationError("Ridge regression needs 1+ predictors")
    y_col, x_cols = num_cols[0], num_cols[1:]
    subset = df[num_cols].dropna()
    alpha = float(options.get("alpha", 1.0))
    scaler = StandardScaler()
    X = scaler.fit_transform(subset[x_cols])
    model = Ridge(alpha=alpha)
    model.fit(X, subset[y_col])
    return _response(
        "ridge-regression",
        "Ridge Regression",
        [
            StatResult(label="Alpha", value=str(alpha)),
            StatResult(label="R²", value=f"{model.score(X, subset[y_col]):.4f}"),
        ]
        + [
            StatResult(label=f"Coef ({c})", value=f"{coef:.4f}")
            for c, coef in zip(x_cols, model.coef_, strict=False)
        ],
        f"Ridge regression (α={alpha}) with {len(x_cols)} predictors.",
    )


# ── Correlation ──────────────────────────────────────────────────────────────


def pearson_correlation(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    x, y = aligned_two_numeric(df, options)
    r, p = stats.pearsonr(x, y)
    chart_data = {"scatter": [{"x": float(a), "y": float(b)} for a, b in zip(x, y, strict=False)]}
    return _response(
        "pearson-correlation",
        "Pearson Correlation",
        [
            StatResult(label="r", value=f"{r:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="N", value=str(len(x))),
        ],
        f"Pearson r = {r:.3f}, p = {format_p(p)}.",
        chart_data=chart_data,
    )


def spearman_correlation(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    x, y = aligned_two_numeric(df, options)
    r, p = stats.spearmanr(x, y)
    return _response(
        "spearman-correlation",
        "Spearman Correlation",
        [
            StatResult(label="ρ", value=f"{r:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Spearman ρ = {r:.3f}, p = {format_p(p)}.",
        chart_data={"scatter": [{"x": float(a), "y": float(b)} for a, b in zip(x, y, strict=False)]},
    )


def kendall_correlation(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    x, y = aligned_two_numeric(df, options)
    r, p = stats.kendalltau(x, y)
    return _response(
        "kendall-correlation",
        "Kendall Correlation",
        [
            StatResult(label="τ", value=f"{r:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Kendall τ = {r:.3f}, p = {format_p(p)}.",
    )


def partial_correlation(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    cols = numeric_columns(df)
    if len(cols) < 3:
        raise DataValidationError("Partial correlation needs 3 numeric variables (X, Y, control)")
    x_col = resolve_numeric_column(df, options, keys=("x_column",), index=0)
    y_col = resolve_numeric_column(df, options, keys=("y_column",), index=1)
    control_col = options.get("control_column")
    if control_col and str(control_col) in cols:
        z_col = str(control_col)
    else:
        z_col = next((c for c in cols if c not in {x_col, y_col}), cols[2])
    subset = df[[x_col, y_col, z_col]].dropna()
    x, y, z = subset[x_col], subset[y_col], subset[z_col]
    r_xy, _ = stats.pearsonr(x, y)
    r_xz, _ = stats.pearsonr(x, z)
    r_yz, _ = stats.pearsonr(y, z)
    denom = np.sqrt((1 - r_xz**2) * (1 - r_yz**2))
    r_partial = (r_xy - r_xz * r_yz) / denom if denom else 0.0
    return _response(
        "partial-correlation",
        "Partial Correlation",
        [
            StatResult(label="Partial r", value=f"{r_partial:.4f}"),
            StatResult(label="Zero-order r", value=f"{r_xy:.4f}"),
        ],
        f"Partial correlation controlling for {z_col}: r = {r_partial:.3f}.",
    )


def point_biserial(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    num_cols = numeric_columns(df)
    cat_cols = categorical_columns(df)
    if not num_cols or not cat_cols:
        raise DataValidationError("Point-biserial needs one numeric and one binary categorical column")
    continuous = df[num_cols[0]].astype(float)
    binary = pd.Categorical(df[cat_cols[0]]).codes
    if len(np.unique(binary)) != 2:
        raise DataValidationError("Categorical column must have exactly 2 categories")
    r, p = stats.pointbiserialr(binary, continuous)
    return _response(
        "point-biserial",
        "Point-Biserial Correlation",
        [
            StatResult(label="r_pb", value=f"{r:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Point-biserial r = {r:.3f}, p = {format_p(p)}.",
    )


# ── Normality ────────────────────────────────────────────────────────────────


def shapiro_wilk(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    arr = first_numeric(df, options).to_numpy()
    if len(arr) > 5000:
        arr = arr[:5000]
    stat, p = stats.shapiro(arr)
    return _response(
        "shapiro-wilk",
        "Shapiro-Wilk Test",
        [
            StatResult(label="W", value=f"{stat:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
            StatResult(label="N", value=str(len(arr))),
        ],
        f"Shapiro-Wilk: W = {stat:.4f}, p = {format_p(p)}. "
        + ("Data appears normally distributed." if p >= 0.05 else "Data deviates from normality."),
    )


def kolmogorov_smirnov(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    arr = first_numeric(df, options).to_numpy()
    stat, p = stats.kstest(arr, "norm", args=(arr.mean(), arr.std(ddof=1)))
    return _response(
        "kolmogorov-smirnov",
        "Kolmogorov-Smirnov Test",
        [
            StatResult(label="D", value=f"{stat:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"K-S test against normal distribution, D = {stat:.4f}, p = {format_p(p)}.",
    )


def anderson_darling(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    arr = first_numeric(df, options).to_numpy()
    result = stats.anderson(arr, dist="norm")
    return _response(
        "anderson-darling",
        "Anderson-Darling Test",
        [
            StatResult(label="A²", value=f"{result.statistic:.4f}"),
            StatResult(label="Critical (5%)", value=f"{result.critical_values[2]:.4f}"),
        ],
        f"Anderson-Darling A² = {result.statistic:.4f}.",
    )


def levene_test(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    values, groups = value_and_group(df, options)
    grouped = groups_from_column(values, groups)
    stat, p = stats.levene(*grouped.values())
    return _response(
        "levene-test",
        "Levene's Test",
        [
            StatResult(label="W", value=f"{stat:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Levene's test for homogeneity of variances, p = {format_p(p)}.",
    )


def bartlett_test(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    values, groups = value_and_group(df, options)
    grouped = groups_from_column(values, groups)
    stat, p = stats.bartlett(*grouped.values())
    return _response(
        "bartlett-test",
        "Bartlett's Test",
        [
            StatResult(label="χ²", value=f"{stat:.4f}"),
            StatResult(label="p-value", value=format_p(p), badge=significance_badge(p)),
        ],
        f"Bartlett's test for equal variances, p = {format_p(p)}.",
    )


def feature_scaling(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    columns = resolve_value_columns(df, options)
    if not columns:
        columns = numeric_columns(df)
    method = str(options.get("transform_method", options.get("scaler_type", "standard")))
    transformed, meta = apply_feature_method(df, columns, method)
    label = METHOD_LABELS.get(meta["method"], meta["method"])
    applied_cols = meta["columns"]
    csv_content = transformed.to_csv(index=False)

    stats = [
        StatResult(label="Method", value=label),
        StatResult(label="Columns transformed", value=str(len(applied_cols))),
        StatResult(label="Rows", value=str(len(transformed))),
    ]
    for col in applied_cols[:4]:
        series = pd.to_numeric(transformed[col], errors="coerce")
        stats.append(StatResult(label=f"Mean ({col})", value=f"{series.mean():.4f}"))
        stats.append(StatResult(label=f"SD ({col})", value=f"{series.std(ddof=1):.4f}"))

    interpretation = (
        f"Applied {label} to {len(applied_cols)} numeric column(s). "
        "Download the transformed dataset below for use in further analysis or modeling."
    )

    return _response(
        "feature-scaling",
        "Feature Scaling & Transformations",
        stats,
        interpretation,
        chart_data={
            "downloads": [
                {
                    "label": "Transformed dataset",
                    "filename": f"feature-scaling-{meta['method']}.csv",
                    "content": csv_content,
                    "format": "csv",
                }
            ]
        },
    )


def normalize_data(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    columns = resolve_value_columns(df, options)
    if not columns:
        columns = numeric_columns(df)
    if not columns:
        raise DataValidationError("Select at least one numeric column to normalize.")

    method = str(options.get("transform_method", "quantile"))
    transformed, meta = apply_feature_method(df, columns, method)
    label = METHOD_LABELS.get(meta["method"], meta["method"])
    applied_cols = meta["columns"]

    result_stats: list[StatResult] = [
        StatResult(label="Method", value=label),
        StatResult(label="Columns normalized", value=str(len(applied_cols))),
        StatResult(label="Rows", value=str(len(transformed))),
    ]

    for col in applied_cols[:3]:
        before = pd.to_numeric(df[col], errors="coerce").dropna().to_numpy()
        after = pd.to_numeric(transformed[col], errors="coerce").dropna().to_numpy()
        if len(before) >= 3:
            _, p_before = stats.shapiro(before[:5000])
            result_stats.append(
                StatResult(
                    label=f"Shapiro p before ({col})",
                    value=format_p(p_before),
                    badge=significance_badge(p_before),
                )
            )
        if len(after) >= 3:
            _, p_after = stats.shapiro(after[:5000])
            result_stats.append(
                StatResult(
                    label=f"Shapiro p after ({col})",
                    value=format_p(p_after),
                    badge=significance_badge(p_after),
                )
            )

    primary_col = applied_cols[0]
    after_arr = pd.to_numeric(transformed[primary_col], errors="coerce").dropna().to_numpy()
    bins = min(10, max(3, len(after_arr) // 2))
    qq_points = build_qq_plot(after_arr)
    original_subset = df[applied_cols].copy()
    downloads = [
        {
            "label": "Normalized data",
            "filename": f"normalized-{method}.csv",
            "content": transformed.to_csv(index=False),
            "format": "csv",
        },
        {
            "label": "Original data",
            "filename": "original-data.csv",
            "content": original_subset.to_csv(index=False),
            "format": "csv",
        },
    ]

    interpretation = (
        f"Applied {label} to {len(applied_cols)} column(s). "
        "Compare Shapiro-Wilk p-values before and after normalization. "
        "Download the normalized dataset below for further analysis."
    )

    return _response(
        "normalize-data",
        "Normalize Data",
        result_stats,
        interpretation,
        chart_data={
            "qq_plot": qq_points,
            "histogram": histogram_bins(after_arr, bins),
            "downloads": downloads,
        },
    )


# ── Other ────────────────────────────────────────────────────────────────────


def factor_analysis(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    cols = numeric_columns(df)
    if len(cols) < 3:
        raise DataValidationError("Factor analysis needs at least 3 numeric variables")
    n_factors = int(options.get("n_factors", 2))
    data = df[cols].dropna()
    fa = FactorAnalysis(n_components=min(n_factors, len(cols) - 1), random_state=42)
    fa.fit(data)
    return _response(
        "factor-analysis",
        "Factor Analysis",
        [
            StatResult(label="Variables", value=str(len(cols))),
            StatResult(label="Factors", value=str(fa.n_components)),
            StatResult(label="N", value=str(len(data))),
        ],
        f"Factor analysis extracted {fa.n_components} factor(s) from {len(cols)} variables.",
    )


def cluster_analysis(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    cols = numeric_columns(df)
    if len(cols) < 2:
        raise DataValidationError("Cluster analysis needs at least 2 numeric variables")
    k = int(options.get("clusters", 3))
    data = StandardScaler().fit_transform(df[cols].dropna())
    model = KMeans(n_clusters=min(k, len(data)), random_state=42, n_init=10)
    labels = model.fit_predict(data)
    counts = pd.Series(labels).value_counts().sort_index()
    return _response(
        "cluster-analysis",
        "Cluster Analysis",
        [
            StatResult(label="Clusters", value=str(model.n_clusters)),
            StatResult(label="Inertia", value=f"{model.inertia_:.4f}"),
        ]
        + [StatResult(label=f"Cluster {i}", value=str(c)) for i, c in counts.items()],
        f"K-means clustering with k = {model.n_clusters}.",
    )


def cronbach_alpha(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    cols = numeric_columns(df)
    if len(cols) < 2:
        raise DataValidationError("Cronbach's alpha needs 2+ item columns")
    data = df[cols].dropna()
    k = len(cols)
    item_vars = data.var(axis=0, ddof=1)
    total_var = data.sum(axis=1).var(ddof=1)
    alpha = (k / (k - 1)) * (1 - item_vars.sum() / total_var) if total_var else 0.0
    quality = "excellent" if alpha >= 0.9 else "good" if alpha >= 0.8 else "acceptable" if alpha >= 0.7 else "poor"
    return _response(
        "cronbach-alpha",
        "Cronbach's Alpha",
        [
            StatResult(label="α", value=f"{alpha:.4f}"),
            StatResult(label="Items", value=str(k)),
            StatResult(label="N", value=str(len(data))),
            StatResult(label="Reliability", value=quality),
        ],
        f"Cronbach's α = {alpha:.3f} ({quality} internal consistency).",
    )


def cohens_kappa(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    rater1, rater2 = two_categorical(df, options)
    kappa = cohen_kappa_score(rater1, rater2)
    agreement = "almost perfect" if kappa >= 0.81 else "substantial" if kappa >= 0.61 else "moderate" if kappa >= 0.41 else "fair"
    return _response(
        "cohens-kappa",
        "Cohen's Kappa",
        [
            StatResult(label="κ", value=f"{kappa:.4f}"),
            StatResult(label="Agreement", value=agreement),
        ],
        f"Cohen's κ = {kappa:.3f} ({agreement} agreement).",
    )


def roc_curve_analysis(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    X, y_raw, outcome_col, predictor_cols = predictors_and_binary_outcome(df, options)
    scores = X[predictor_cols[0]].to_numpy()
    labels = pd.Categorical(y_raw).codes
    if len(np.unique(labels)) != 2:
        raise DataValidationError("Outcome must be binary")
    fpr, tpr, _ = roc_curve(labels, scores)
    auc = roc_auc_score(labels, scores)
    return _response(
        "roc-curve",
        "ROC Curve Analysis",
        [
            StatResult(label="AUC", value=f"{auc:.4f}"),
            StatResult(label="N", value=str(len(scores))),
        ],
        f"ROC AUC = {auc:.3f}.",
        chart_data={"roc": [{"fpr": float(a), "tpr": float(b)} for a, b in zip(fpr, tpr, strict=False)]},
    )


def power_analysis(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    effect = float(options.get("effect_size", 0.5))
    alpha = float(options.get("alpha", 0.05))
    power = float(options.get("power", 0.8))
    analysis = TTestIndPower()
    n = analysis.solve_power(effect_size=effect, alpha=alpha, power=power)
    return _response(
        "power-analysis",
        "Power Analysis",
        [
            StatResult(label="Effect size (d)", value=str(effect)),
            StatResult(label="Alpha", value=str(alpha)),
            StatResult(label="Power", value=str(power)),
            StatResult(label="Required N (per group)", value=f"{n:.0f}"),
        ],
        f"Required sample size per group: {n:.0f} (d={effect}, power={power}).",
    )


TEST_REGISTRY: dict[str, Callable[[pd.DataFrame, dict], AnalysisResponse]] = {
    "summary-statistics": summary_statistics,
    "frequency-table": frequency_table,
    "cross-tabulation": cross_tabulation,
    "histogram": histogram,
    "box-plot": box_plot,
    "percentiles": percentiles,
    "one-sample-ttest": one_sample_ttest,
    "independent-ttest": independent_ttest,
    "paired-ttest": paired_ttest,
    "one-way-anova": one_way_anova,
    "two-way-anova": two_way_anova,
    "repeated-measures-anova": repeated_measures_anova,
    "chi-square": chi_square,
    "fishers-exact": fishers_exact,
    "mann-whitney": mann_whitney,
    "wilcoxon-signed-rank": wilcoxon_signed_rank,
    "kruskal-wallis": kruskal_wallis,
    "friedman": friedman,
    "mcnemar": mcnemar,
    "linear-regression": linear_regression,
    "multiple-regression": multiple_regression,
    "logistic-regression": logistic_regression,
    "classification-models": classification_models,
    "regression-models": regression_models,
    "time-series-models": time_series_models,
    "polynomial-regression": polynomial_regression,
    "ridge-regression": ridge_regression,
    "pearson-correlation": pearson_correlation,
    "spearman-correlation": spearman_correlation,
    "kendall-correlation": kendall_correlation,
    "partial-correlation": partial_correlation,
    "point-biserial": point_biserial,
    "shapiro-wilk": shapiro_wilk,
    "kolmogorov-smirnov": kolmogorov_smirnov,
    "anderson-darling": anderson_darling,
    "levene-test": levene_test,
    "bartlett-test": bartlett_test,
    "feature-scaling": feature_scaling,
    "normalize-data": normalize_data,
    "factor-analysis": factor_analysis,
    "cluster-analysis": cluster_analysis,
    "cronbach-alpha": cronbach_alpha,
    "cohens-kappa": cohens_kappa,
    "roc-curve": roc_curve_analysis,
    "power-analysis": power_analysis,
}


MULTI_VALUE_TESTS = frozenset(
    {
        "summary-statistics",
        "histogram",
        "box-plot",
        "percentiles",
        "one-sample-ttest",
        "shapiro-wilk",
        "kolmogorov-smirnov",
        "anderson-darling",
        "independent-ttest",
        "mann-whitney",
        "kruskal-wallis",
        "levene-test",
        "bartlett-test",
    }
)

GROUPABLE_TESTS = frozenset(
    {
        "histogram",
        "box-plot",
        "percentiles",
        "one-sample-ttest",
        "shapiro-wilk",
        "kolmogorov-smirnov",
        "anderson-darling",
    }
)


def _run_single(test_id: str, df: pd.DataFrame, options: dict) -> AnalysisResponse:
    result = TEST_REGISTRY[test_id](df, options)
    return enrich_chart_data(test_id, df, result, options)


def _run_multi_value_batch(test_id: str, df: pd.DataFrame, opts: dict) -> AnalysisResponse | None:
    value_columns = opts.get("value_columns")
    if not (
        test_id in MULTI_VALUE_TESTS
        and isinstance(value_columns, list)
        and len(value_columns) > 1
    ):
        return None

    batch: list[AnalysisResponse] = []
    for col in value_columns:
        col_opts = {**opts, "value_column": col, "value_columns": [col]}
        item = _run_single(test_id, df, col_opts)
        item.variable_name = str(col)
        item.title = f"{item.title} — {col}"
        batch.append(item)

    return AnalysisResponse(
        test_id=test_id,
        title=f"{batch[0].title.split(' — ')[0]} ({len(batch)} variables)",
        stats=[],
        interpretation=(
            f"Analysis completed for {len(batch)} variable(s): "
            f"{', '.join(str(c) for c in value_columns)}."
        ),
        batch_results=batch,
    )


def _run_grouped_analysis(
    test_id: str,
    df: pd.DataFrame,
    opts: dict,
    group_name: str,
) -> AnalysisResponse:
    groups = sorted(df[group_name].dropna().astype(str).unique().tolist())
    if not groups:
        raise DataValidationError("Group column has no usable categories")

    base_opts = {**opts}
    base_opts.pop("group_column", None)
    batch: list[AnalysisResponse] = []

    for group in groups:
        group_df = df[df[group_name].astype(str) == group]
        if group_df.empty:
            continue

        grouped = _run_multi_value_batch(test_id, group_df, base_opts)
        if grouped and grouped.batch_results:
            for item in grouped.batch_results:
                item.title = f"{item.title} — {group}"
                item.variable_name = (
                    f"{group}|{item.variable_name}" if item.variable_name else group
                )
                batch.append(item)
            continue

        item = _run_single(test_id, group_df, base_opts)
        value_label = item.variable_name or base_opts.get("value_column")
        item.title = f"{item.title} — {group}"
        item.variable_name = f"{group}|{value_label}" if value_label else group
        batch.append(item)

    if not batch:
        raise DataValidationError("No data found in any group")

    return AnalysisResponse(
        test_id=test_id,
        title=f"{batch[0].title.split(' — ')[0]} by {group_name}",
        stats=[],
        interpretation=(
            f"Analysis segmented by {group_name} across {len(batch)} result(s)."
        ),
        batch_results=batch,
    )


def run_analysis(test_id: str, csv_data: str, options: dict | None = None) -> AnalysisResponse:
    if test_id not in TEST_REGISTRY:
        raise TestNotFoundError(test_id)

    opts = dict(options or {})
    value_columns = opts.get("value_columns")
    if isinstance(value_columns, list) and len(value_columns) == 1:
        opts["value_column"] = str(value_columns[0])

    df = parse_csv(csv_data)

    group_col = opts.get("group_column")
    if (
        group_col
        and str(group_col) in df.columns
        and test_id in GROUPABLE_TESTS
    ):
        grouped = _run_grouped_analysis(test_id, df, opts, str(group_col))
        return _enrich_with_summary_metrics(test_id, df, opts, grouped)

    multi = _run_multi_value_batch(test_id, df, opts)
    if multi:
        return _enrich_with_summary_metrics(test_id, df, opts, multi)

    result = _run_single(test_id, df, opts)
    if isinstance(value_columns, list) and len(value_columns) == 1:
        result.variable_name = str(value_columns[0])
    return _enrich_with_summary_metrics(test_id, df, opts, result)


def list_tests() -> list[dict[str, str]]:
    labels = {
        "summary-statistics": "Summary Statistics",
        "frequency-table": "Frequency Table",
        "cross-tabulation": "Cross Tabulation",
        "histogram": "Histogram",
        "box-plot": "Box Plot",
        "percentiles": "Percentiles & Quartiles",
        "one-sample-ttest": "One-Sample t-Test",
        "independent-ttest": "Independent Samples t-Test",
        "paired-ttest": "Paired Samples t-Test",
        "one-way-anova": "One-Way ANOVA",
        "two-way-anova": "Two-Way ANOVA",
        "repeated-measures-anova": "Repeated Measures ANOVA",
        "chi-square": "Chi-Square Test",
        "fishers-exact": "Fisher's Exact Test",
        "mann-whitney": "Mann-Whitney U Test",
        "wilcoxon-signed-rank": "Wilcoxon Signed-Rank Test",
        "kruskal-wallis": "Kruskal-Wallis Test",
        "friedman": "Friedman Test",
        "mcnemar": "McNemar Test",
        "linear-regression": "Linear Regression",
        "multiple-regression": "Multiple Regression",
        "logistic-regression": "Logistic Regression",
        "classification-models": "Classification Models",
        "regression-models": "Regression Models",
        "time-series-models": "Time Series Models",
        "polynomial-regression": "Polynomial Regression",
        "ridge-regression": "Ridge Regression",
        "pearson-correlation": "Pearson Correlation",
        "spearman-correlation": "Spearman Correlation",
        "kendall-correlation": "Kendall Correlation",
        "partial-correlation": "Partial Correlation",
        "point-biserial": "Point-Biserial Correlation",
        "shapiro-wilk": "Shapiro-Wilk Test",
        "kolmogorov-smirnov": "Kolmogorov-Smirnov Test",
        "anderson-darling": "Anderson-Darling Test",
        "levene-test": "Levene's Test",
        "bartlett-test": "Bartlett's Test",
        "feature-scaling": "Feature Scaling & Transformations",
        "normalize-data": "Normalize Data",
        "factor-analysis": "Factor Analysis",
        "cluster-analysis": "Cluster Analysis",
        "cronbach-alpha": "Cronbach's Alpha",
        "cohens-kappa": "Cohen's Kappa",
        "roc-curve": "ROC Curve Analysis",
        "power-analysis": "Power Analysis",
    }
    return [{"id": tid, "label": labels[tid]} for tid in TEST_REGISTRY]
