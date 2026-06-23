from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler, RobustScaler, StandardScaler

from app.core.exceptions import DataValidationError


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
    return StandardScaler()


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
