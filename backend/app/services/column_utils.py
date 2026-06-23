from __future__ import annotations

import pandas as pd

from app.core.exceptions import DataValidationError


def parse_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        raise DataValidationError("CSV data is empty")
    return df


def numeric_columns(df: pd.DataFrame) -> list[str]:
    cols: list[str] = []
    for col in df.columns:
        series = pd.to_numeric(df[col], errors="coerce")
        if series.notna().sum() > 0:
            cols.append(str(col))
    return cols


def categorical_columns(df: pd.DataFrame) -> list[str]:
    num = set(numeric_columns(df))
    return [str(col) for col in df.columns if str(col) not in num]


def _options(options: dict | None) -> dict:
    return options or {}


def _pick_named_column(
    df: pd.DataFrame,
    options: dict,
    keys: tuple[str, ...],
    pool: list[str],
    label: str,
) -> str | None:
    for key in keys:
        name = options.get(key)
        if name and str(name) in df.columns:
            return str(name)
    return None


MAX_VALUE_COLUMNS = 20


def resolve_value_columns(
    df: pd.DataFrame,
    options: dict | None = None,
    *,
    keys: tuple[str, ...] = ("value_columns", "value_column", "variable_column", "y_column"),
    exclude: set[str] | None = None,
) -> list[str]:
    options = _options(options)
    pool = numeric_columns(df)
    if not pool:
        raise DataValidationError("No numeric column found in data")

    excluded = exclude or set()
    pool = [col for col in pool if col not in excluded]

    raw = options.get("value_columns")
    if isinstance(raw, list):
        selected = [str(name) for name in raw if str(name) in df.columns]
        if not selected:
            raise DataValidationError("Select at least one numeric variable")
        invalid = [name for name in selected if name not in pool]
        if invalid:
            raise DataValidationError(
                f"Column(s) must be numeric: {', '.join(invalid)}"
            )
        if len(selected) > MAX_VALUE_COLUMNS:
            raise DataValidationError(
                f"Select at most {MAX_VALUE_COLUMNS} variables at a time"
            )
        return selected

    for key in keys:
        if key == "value_columns":
            continue
        name = options.get(key)
        if name and str(name) in df.columns:
            col = str(name)
            if col not in pool:
                raise DataValidationError(f"Column '{col}' must be numeric")
            return [col]

    if not pool:
        raise DataValidationError("No numeric column found in data")
    return [pool[0]]


def resolve_numeric_column(
    df: pd.DataFrame,
    options: dict | None = None,
    *,
    keys: tuple[str, ...] = ("value_column", "variable_column", "y_column", "x_column"),
    index: int = 0,
) -> str:
    options = _options(options)
    pool = numeric_columns(df)
    if not pool:
        raise DataValidationError("No numeric column found in data")

    named = _pick_named_column(df, options, keys, pool, "numeric")
    if named:
        if named not in pool:
            raise DataValidationError(f"Column '{named}' must be numeric")
        return named
    if index >= len(pool):
        raise DataValidationError(f"Expected at least {index + 1} numeric column(s)")
    return pool[index]


def resolve_categorical_column(
    df: pd.DataFrame,
    options: dict | None = None,
    *,
    keys: tuple[str, ...] = ("group_column", "col_column", "row_column", "outcome_column"),
    index: int = -1,
) -> str:
    options = _options(options)
    pool = categorical_columns(df)
    if not pool:
        raise DataValidationError("No categorical/text column found in data")

    named = _pick_named_column(df, options, keys, pool, "categorical")
    if named:
        return named
    return pool[index]


def first_numeric(df: pd.DataFrame, options: dict | None = None) -> pd.Series:
    col = resolve_numeric_column(df, options, keys=("value_column", "variable_column", "y_column"))
    return pd.to_numeric(df[col], errors="coerce").dropna().astype(float)


def numeric_at(df: pd.DataFrame, index: int = 0, options: dict | None = None) -> pd.Series:
    col = resolve_numeric_column(df, options, index=index)
    return pd.to_numeric(df[col], errors="coerce").dropna().astype(float)


_GROUP_NAME_HINTS = (
    "group",
    "treatment",
    "condition",
    "category",
    "arm",
    "cohort",
    "class",
    "gender",
    "sex",
)


def _group_name_score(name: str) -> int:
    lower = name.lower()
    return sum(1 for hint in _GROUP_NAME_HINTS if hint in lower)


def group_column_candidates(df: pd.DataFrame) -> list[str]:
    candidates: list[str] = []
    for col in df.columns:
        name = str(col)
        series = df[name].dropna()
        nunique = int(series.nunique())
        if nunique < 2:
            continue
        if name in categorical_columns(df):
            candidates.append(name)
            continue
        if name not in numeric_columns(df) or nunique > 20:
            continue
        # Skip continuous measurements where almost every row is a distinct value.
        if nunique >= len(series) * 0.8:
            continue
        candidates.append(name)
    return candidates


def resolve_group_column(
    df: pd.DataFrame,
    options: dict | None = None,
    *,
    value_col: str | None = None,
) -> str:
    options = _options(options)
    candidates = group_column_candidates(df)
    if not candidates:
        raise DataValidationError(
            "No group variable found. Add a column with at least 2 different categories "
            "(e.g. Group with values A and B, or treatment 0/1)."
        )

    preferred = options.get("group_column")
    if preferred and str(preferred) in df.columns:
        name = str(preferred)
        subset = df[[value_col, name]].dropna() if value_col else df[[name]].dropna()
        nunique = int(subset[name].nunique())
        if nunique >= 2:
            return name
        unique_vals = sorted(subset[name].astype(str).unique().tolist())
        raise DataValidationError(
            f"Column '{name}' has only one group ({', '.join(unique_vals)}). "
            "This test needs at least 2 groups — pick a column like Group with A and B."
        )

    def score(col: str) -> tuple[int, int]:
        if value_col and col == value_col:
            return (-1, -1)
        subset = df[[value_col, col]].dropna() if value_col else df[[col]].dropna()
        return (_group_name_score(col), int(subset[col].nunique()))

    return max(candidates, key=score)


def value_and_group(df: pd.DataFrame, options: dict | None = None) -> tuple[pd.Series, pd.Series]:
    options = _options(options)
    value_col = resolve_numeric_column(df, options, keys=("value_column", "y_column"))
    group_name = resolve_group_column(df, options, value_col=value_col)
    subset = df[[value_col, group_name]].dropna()
    values = pd.to_numeric(subset[value_col], errors="coerce")
    valid = values.notna()
    subset = subset[valid]
    values = values[valid].astype(float)
    groups = subset[group_name].astype(str)
    if groups.nunique() < 2:
        unique_vals = sorted(groups.unique().tolist())
        raise DataValidationError(
            f"Column '{group_name}' has only one group ({', '.join(unique_vals)}). "
            "This test needs at least 2 groups — pick a column like Group with A and B."
        )
    return values, groups


def two_numeric(
    df: pd.DataFrame,
    options: dict | None = None,
) -> tuple[pd.Series, pd.Series]:
    x_col = resolve_numeric_column(df, options, keys=("x_column",), index=0)
    y_col = resolve_numeric_column(df, options, keys=("y_column", "value_column"), index=1)
    if x_col == y_col:
        pool = numeric_columns(df)
        if len(pool) < 2:
            raise DataValidationError("Need at least two numeric columns")
        y_col = pool[1]
    subset = df[[x_col, y_col]].dropna()
    return (
        pd.to_numeric(subset[x_col], errors="coerce").astype(float),
        pd.to_numeric(subset[y_col], errors="coerce").astype(float),
    )


def aligned_two_numeric(df: pd.DataFrame, options: dict | None = None) -> tuple[pd.Series, pd.Series]:
    return two_numeric(df, options)


def two_categorical(df: pd.DataFrame, options: dict | None = None) -> tuple[pd.Series, pd.Series]:
    options = _options(options)
    row = options.get("row_column")
    col = options.get("col_column")
    if row and col and str(row) in df.columns and str(col) in df.columns:
        return df[str(row)].astype(str), df[str(col)].astype(str)
    cats = categorical_columns(df)
    if len(cats) >= 2:
        return df[cats[0]].astype(str), df[cats[1]].astype(str)
    nums = numeric_columns(df)
    if len(nums) >= 2:
        return df[nums[0]].astype(str), df[nums[1]].astype(str)
    raise DataValidationError("Need two categorical columns for this test")


def groups_from_column(values: pd.Series, groups: pd.Series) -> dict[str, list[float]]:
    result: dict[str, list[float]] = {}
    for group_name, value in zip(groups, values, strict=False):
        result.setdefault(str(group_name), []).append(float(value))
    if len(result) < 2:
        unique_vals = sorted({str(g) for g in groups.unique()})
        raise DataValidationError(
            f"Need at least 2 groups in the group column (found: {', '.join(unique_vals)}). "
            "Choose a column with different categories, e.g. Group = A and B."
        )
    return result


def format_p(p_value: float) -> str:
    if p_value < 0.001:
        return "< .001"
    return f"{p_value:.4f}"


def significance_badge(p_value: float, alpha: float = 0.05) -> dict[str, str]:
    significant = p_value < alpha
    return {
        "text": "Significant" if significant else "Not significant",
        "variant": "success" if significant else "neutral",
    }


def list_variables(df: pd.DataFrame) -> list[dict[str, str | int | bool]]:
    eligible = set(group_column_candidates(df))
    variables: list[dict[str, str | int | bool]] = []
    for col in df.columns:
        name = str(col)
        nunique = int(df[name].dropna().nunique())
        if name in numeric_columns(df):
            variables.append(
                {
                    "name": name,
                    "type": "numeric",
                    "unique_count": nunique,
                    "group_eligible": name in eligible,
                }
            )
        else:
            variables.append(
                {
                    "name": name,
                    "type": "categorical",
                    "unique_count": nunique,
                    "group_eligible": name in eligible,
                }
            )
    return variables


def predictors_and_binary_outcome(
    df: pd.DataFrame,
    options: dict | None = None,
) -> tuple[pd.DataFrame, pd.Series, str, list[str]]:
    options = _options(options)
    cat_cols = categorical_columns(df)
    num_cols = numeric_columns(df)

    outcome_col: str | None = None
    if options.get("outcome_column") and str(options["outcome_column"]) in df.columns:
        outcome_col = str(options["outcome_column"])
    else:
        for col in reversed(cat_cols):
            if df[col].dropna().nunique() == 2:
                outcome_col = col
                break

    if outcome_col is None:
        for col in reversed(num_cols):
            if df[col].dropna().nunique() == 2:
                outcome_col = col
                break

    if outcome_col is None:
        raise DataValidationError(
            "Need a binary outcome variable (0/1 or exactly 2 categories)"
        )

    selected = options.get("predictor_columns") or options.get("x_column")
    if isinstance(selected, str):
        predictor_cols = [selected]
    elif isinstance(selected, list):
        predictor_cols = [str(c) for c in selected]
    else:
        predictor_cols = []

    predictor_cols = [c for c in predictor_cols if c in num_cols and c != outcome_col]
    if not predictor_cols:
        predictor_cols = [col for col in num_cols if col != outcome_col]

    if not predictor_cols:
        raise DataValidationError("Need at least one numeric predictor variable")

    subset = df[predictor_cols + [outcome_col]].dropna()
    if len(subset) < 3:
        raise DataValidationError("Need at least 3 complete rows")

    return (
        subset[predictor_cols].astype(float),
        subset[outcome_col],
        outcome_col,
        predictor_cols,
    )


def predictors_and_numeric_outcome(
    df: pd.DataFrame,
    options: dict | None = None,
) -> tuple[pd.DataFrame, pd.Series, str, list[str]]:
    options = _options(options)
    num_cols = numeric_columns(df)

    outcome_col: str | None = None
    for key in ("y_column", "outcome_column", "value_column"):
        name = options.get(key)
        if name and str(name) in df.columns:
            outcome_col = str(name)
            break

    if outcome_col is None:
        outcome_col = num_cols[-1] if num_cols else None

    if outcome_col is None or outcome_col not in num_cols:
        raise DataValidationError("Need a numeric outcome variable (Y)")

    selected = options.get("predictor_columns") or options.get("x_column")
    if isinstance(selected, str):
        predictor_cols = [selected]
    elif isinstance(selected, list):
        predictor_cols = [str(c) for c in selected]
    else:
        predictor_cols = []

    predictor_cols = [c for c in predictor_cols if c in num_cols and c != outcome_col]
    if not predictor_cols:
        predictor_cols = [col for col in num_cols if col != outcome_col]

    if not predictor_cols:
        raise DataValidationError("Need at least one numeric predictor variable")

    subset = df[predictor_cols + [outcome_col]].dropna()
    y = pd.to_numeric(subset[outcome_col], errors="coerce")
    valid = y.notna()
    subset = subset[valid]
    y = y[valid].astype(float)

    if len(subset) < 3:
        raise DataValidationError("Need at least 3 complete rows")

    if y.nunique() < 2:
        raise DataValidationError("Outcome variable must have at least 2 distinct values")

    return (
        subset[predictor_cols].astype(float),
        y,
        outcome_col,
        predictor_cols,
    )


def parse_time_series(
    df: pd.DataFrame,
    options: dict | None = None,
) -> tuple[pd.Series, str, str]:
    options = _options(options)
    num_cols = numeric_columns(df)

    date_col: str | None = None
    for key in ("date_column", "time_column", "datetime_column"):
        name = options.get(key)
        if name and str(name) in df.columns:
            date_col = str(name)
            break
    if date_col is None:
        for col in df.columns:
            if str(col).lower() in {"date", "time", "datetime", "month", "period", "timestamp"}:
                date_col = str(col)
                break
    if date_col is None:
        date_col = str(df.columns[0])

    value_col: str | None = None
    for key in ("value_column", "y_column", "series_column"):
        name = options.get(key)
        if name and str(name) in df.columns:
            value_col = str(name)
            break
    if value_col is None:
        for col in num_cols:
            if col != date_col:
                value_col = col
                break
    if value_col is None or value_col not in num_cols:
        raise DataValidationError("Need a numeric value column for the time series")

    subset = df[[date_col, value_col]].copy()
    subset[date_col] = pd.to_datetime(subset[date_col], errors="coerce")
    subset[value_col] = pd.to_numeric(subset[value_col], errors="coerce")
    subset = subset.dropna().sort_values(date_col)
    if len(subset) < 12:
        raise DataValidationError("Need at least 12 dated observations after cleaning")

    series = subset.set_index(date_col)[value_col].astype(float)
    if series.nunique() < 2:
        raise DataValidationError("Value column must vary over time")

    return series, date_col, value_col
