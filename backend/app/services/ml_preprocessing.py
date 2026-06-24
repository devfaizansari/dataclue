from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import (
    MaxAbsScaler,
    MinMaxScaler,
    PowerTransformer,
    QuantileTransformer,
    RobustScaler,
    StandardScaler,
)

from app.core.exceptions import DataValidationError

SCALER_TYPES = frozenset({"standard", "minmax", "robust", "maxabs", "quantile", "power"})
TRANSFORM_TYPES = frozenset({"log", "log1p", "sqrt"})
FEATURE_METHODS = SCALER_TYPES | TRANSFORM_TYPES

METHOD_LABELS = {
    "standard": "StandardScaler",
    "minmax": "MinMaxScaler",
    "robust": "RobustScaler",
    "maxabs": "MaxAbsScaler",
    "quantile": "QuantileTransformer",
    "power": "PowerTransformer (Yeo-Johnson)",
    "log": "Log transform",
    "log1p": "Log1p transform",
    "sqrt": "Square-root transform",
}


def _resolve_scope(df: pd.DataFrame, preprocessing: dict[str, Any]) -> list[str]:
    raw_scope = preprocessing.get("scope_columns")
    if isinstance(raw_scope, list) and raw_scope:
        return [str(column) for column in raw_scope if str(column) in df.columns]
    return [str(column) for column in df.columns]


def apply_preprocessing(df: pd.DataFrame, options: dict[str, Any]) -> pd.DataFrame:
    preprocessing = options.get("preprocessing") or {}
    if not isinstance(preprocessing, dict):
        raise DataValidationError("preprocessing must be an object")

    work = df.copy()
    scope = _resolve_scope(work, preprocessing)

    column_types = preprocessing.get("column_types") or {}
    if isinstance(column_types, dict):
        for column, raw_type in column_types.items():
            if column not in work.columns or column not in scope:
                continue
            if str(raw_type) == "numeric":
                work[column] = pd.to_numeric(work[column], errors="coerce")
            elif str(raw_type) == "categorical":
                work[column] = work[column].astype(str)

    strategy = str(preprocessing.get("missing_values", "drop"))
    numeric_cols = [
        str(col)
        for col in scope
        if col in work.columns and pd.api.types.is_numeric_dtype(work[col])
    ]
    non_numeric_scope = [col for col in scope if col not in numeric_cols]

    if strategy == "drop":
        work = work.dropna(subset=scope)
    elif strategy == "impute_mean":
        for col in numeric_cols:
            work[col] = pd.to_numeric(work[col], errors="coerce")
            work[col] = work[col].fillna(work[col].mean())
        if non_numeric_scope:
            work = work.dropna(subset=non_numeric_scope)
    elif strategy == "impute_median":
        for col in numeric_cols:
            work[col] = pd.to_numeric(work[col], errors="coerce")
            work[col] = work[col].fillna(work[col].median())
        if non_numeric_scope:
            work = work.dropna(subset=non_numeric_scope)
    elif strategy != "none":
        raise DataValidationError(f"Unknown missing values strategy '{strategy}'")

    if work.empty:
        raise DataValidationError(
            "No rows remain after preprocessing. Check missing values in your selected "
            "outcome and predictor columns, or change missing values handling."
        )

    return work


def get_scaler(scaler_type: str | None):
    key = (scaler_type or "standard").lower()
    if key == "minmax":
        return MinMaxScaler()
    if key == "robust":
        return RobustScaler()
    if key == "maxabs":
        return MaxAbsScaler()
    if key == "quantile":
        return QuantileTransformer(output_distribution="normal", random_state=42)
    if key == "power":
        return PowerTransformer(method="yeo-johnson")
    return StandardScaler()


def _numeric_columns(df: pd.DataFrame, columns: list[str]) -> list[str]:
    numeric: list[str] = []
    for col in columns:
        if col not in df.columns:
            continue
        coerced = pd.to_numeric(df[col], errors="coerce")
        if coerced.notna().any():
            numeric.append(str(col))
    return numeric


def _prepare_numeric_subset(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    subset = df[columns].apply(pd.to_numeric, errors="coerce")
    if subset.isna().any().any():
        subset = subset.fillna(subset.median(numeric_only=True))
    if subset.isna().any().any():
        raise DataValidationError(
            "Selected columns contain non-numeric values that cannot be transformed."
        )
    return subset


def apply_feature_method(
    df: pd.DataFrame,
    columns: list[str],
    method: str,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    key = (method or "standard").lower()
    if key not in FEATURE_METHODS:
        raise DataValidationError(
            f"Unknown transform method '{method}'. "
            f"Supported methods: {', '.join(sorted(FEATURE_METHODS))}."
        )

    numeric_cols = _numeric_columns(df, columns)
    if not numeric_cols:
        raise DataValidationError("Select at least one numeric column to transform.")

    work = df.copy()
    subset = _prepare_numeric_subset(work, numeric_cols)

    if key in SCALER_TYPES:
        transformed = get_scaler(key).fit_transform(subset)
        work[numeric_cols] = transformed
        return work, {"method": key, "columns": numeric_cols, "kind": "scaler"}

    if key == "log":
        if (subset <= 0).any().any():
            raise DataValidationError("Log transform requires all selected values to be positive.")
        work[numeric_cols] = np.log(subset)
    elif key == "log1p":
        if (subset < -1).any().any():
            raise DataValidationError("Log1p transform requires all selected values to be greater than -1.")
        work[numeric_cols] = np.log1p(subset)
    elif key == "sqrt":
        if (subset < 0).any().any():
            raise DataValidationError("Square-root transform requires all selected values to be non-negative.")
        work[numeric_cols] = np.sqrt(subset)

    return work, {"method": key, "columns": numeric_cols, "kind": "transform"}


def apply_feature_selection(
    X: pd.DataFrame,
    y: np.ndarray,
    enabled: bool,
) -> tuple[pd.DataFrame, list[str]]:
    if not enabled or X.shape[1] <= 1:
        return X, list(X.columns)

    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

    y_arr = np.asarray(y)
    use_regressor = len(np.unique(y_arr)) > 15
    selector = (
        RandomForestRegressor(n_estimators=100, random_state=42)
        if use_regressor
        else RandomForestClassifier(n_estimators=100, random_state=42)
    )
    selector.fit(X, y)
    importances = selector.feature_importances_
    threshold = float(np.mean(importances))
    keep = [col for col, score in zip(X.columns, importances, strict=True) if score >= threshold]
    if not keep:
        keep = [str(X.columns[int(np.argmax(importances))])]
    return X[keep], [str(col) for col in keep]
