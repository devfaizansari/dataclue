from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import ElasticNet, Lasso, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, ShuffleSplit, cross_validate, train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor

from app.core.exceptions import DataValidationError
from app.schemas.common import AnalysisResponse, StatResult
from app.services.column_utils import predictors_and_numeric_outcome
from app.services.ml_preprocessing import apply_feature_selection, apply_preprocessing, get_scaler

try:
    from xgboost import XGBRegressor
except ImportError:  # pragma: no cover
    XGBRegressor = None  # type: ignore[misc, assignment]

VALID_MODELS = frozenset(
    {
        "linear_regression",
        "ridge",
        "lasso",
        "elastic_net",
        "knn",
        "svr",
        "decision_tree",
        "random_forest",
        "xgboost",
        "gradient_boosting",
    }
)

MODEL_LABELS = {
    "linear_regression": "Linear Regression",
    "ridge": "Ridge Regression",
    "lasso": "Lasso Regression",
    "elastic_net": "Elastic Net",
    "knn": "K-Nearest Neighbors",
    "svr": "Support Vector Regression",
    "decision_tree": "Decision Tree",
    "random_forest": "Random Forest",
    "xgboost": "XGBoost",
    "gradient_boosting": "Gradient Boosting",
}

MODELS_NEEDING_SCALE = frozenset({"ridge", "lasso", "elastic_net", "knn", "svr", "linear_regression"})


def _hp(hyperparameters: dict[str, Any] | None, key: str, default: Any) -> Any:
    if not hyperparameters:
        return default
    value = hyperparameters.get(key, default)
    return default if value is None or value == "" else value


def _optional_int(value: Any) -> int | None:
    if value is None or value == "" or str(value).lower() == "none":
        return None
    return int(value)


def build_regressor(model_id: str, hyperparameters: dict[str, Any] | None, random_state: int):
    hp = hyperparameters or {}

    if model_id == "linear_regression":
        return LinearRegression()

    if model_id == "ridge":
        return Ridge(alpha=float(_hp(hp, "alpha", 1.0)), random_state=random_state)

    if model_id == "lasso":
        return Lasso(
            alpha=float(_hp(hp, "alpha", 1.0)),
            max_iter=int(_hp(hp, "max_iter", 2000)),
            random_state=random_state,
        )

    if model_id == "elastic_net":
        return ElasticNet(
            alpha=float(_hp(hp, "alpha", 1.0)),
            l1_ratio=float(_hp(hp, "l1_ratio", 0.5)),
            max_iter=int(_hp(hp, "max_iter", 2000)),
            random_state=random_state,
        )

    if model_id == "knn":
        return KNeighborsRegressor(
            n_neighbors=max(1, int(_hp(hp, "n_neighbors", 5))),
            weights=str(_hp(hp, "weights", "uniform")),
            metric=str(_hp(hp, "metric", "minkowski")),
        )

    if model_id == "svr":
        gamma_value = _hp(hp, "gamma", "scale")
        gamma: str | float = gamma_value if gamma_value in {"scale", "auto"} else float(gamma_value)
        return SVR(
            C=float(_hp(hp, "C", 1.0)),
            kernel=str(_hp(hp, "kernel", "rbf")),
            gamma=gamma,
            epsilon=float(_hp(hp, "epsilon", 0.1)),
        )

    if model_id == "decision_tree":
        return DecisionTreeRegressor(
            max_depth=_optional_int(_hp(hp, "max_depth", None)),
            min_samples_split=max(2, int(_hp(hp, "min_samples_split", 2))),
            random_state=random_state,
        )

    if model_id == "random_forest":
        return RandomForestRegressor(
            n_estimators=max(1, int(_hp(hp, "n_estimators", 100))),
            max_depth=_optional_int(_hp(hp, "max_depth", None)),
            min_samples_split=max(2, int(_hp(hp, "min_samples_split", 2))),
            random_state=random_state,
        )

    if model_id == "xgboost":
        if XGBRegressor is None:
            raise DataValidationError(
                "XGBoost is not installed on the server. Choose another model or install xgboost."
            )
        return XGBRegressor(
            n_estimators=max(1, int(_hp(hp, "n_estimators", 100))),
            max_depth=max(1, int(_hp(hp, "max_depth", 6))),
            learning_rate=float(_hp(hp, "learning_rate", 0.1)),
            subsample=float(_hp(hp, "subsample", 1.0)),
            random_state=random_state,
        )

    if model_id == "gradient_boosting":
        return GradientBoostingRegressor(
            n_estimators=max(1, int(_hp(hp, "n_estimators", 100))),
            max_depth=max(1, int(_hp(hp, "max_depth", 3))),
            learning_rate=float(_hp(hp, "learning_rate", 0.1)),
            random_state=random_state,
        )

    raise DataValidationError(f"Unknown regression model '{model_id}'")


def _build_cv(strategy: str, folds: int, random_state: int):
    if strategy == "shuffle_split":
        return ShuffleSplit(n_splits=folds, test_size=0.2, random_state=random_state)
    return KFold(n_splits=folds, shuffle=True, random_state=random_state)


def _fit_model(
    model_id: str,
    hyperparameters: dict[str, Any] | None,
    random_state: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
):
    model = build_regressor(model_id, hyperparameters, random_state)
    model.fit(X_train, y_train)
    return model, "Manual hyperparameters"


def _regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    mse = float(mean_squared_error(y_true, y_pred))
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "mse": mse,
        "rmse": float(np.sqrt(mse)),
    }


def _prediction_chart(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, Any]:
    scatter = [
        {"x": float(actual), "y": float(pred)}
        for actual, pred in zip(y_true, y_pred, strict=False)
    ]
    lo = float(min(y_true.min(), y_pred.min()))
    hi = float(max(y_true.max(), y_pred.max()))
    regression_line = [{"x": lo, "y": lo}, {"x": hi, "y": hi}]
    return {"scatter": scatter, "regression_line": regression_line}


def _analysis_columns(df: pd.DataFrame, options: dict) -> list[str]:
    columns: list[str] = []
    for key in ("y_column", "outcome_column", "value_column"):
        outcome = options.get(key)
        if outcome and str(outcome) in df.columns:
            columns.append(str(outcome))
            break

    predictors = options.get("predictor_columns") or options.get("x_column")
    if isinstance(predictors, str):
        predictors = [predictors]
    elif not isinstance(predictors, list):
        predictors = []

    for column in predictors:
        name = str(column)
        if name in df.columns and name not in columns:
            columns.append(name)

    return columns


def regression_models(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    scope = _analysis_columns(df, options)
    preprocessing = dict(options.get("preprocessing") or {})
    if scope:
        preprocessing["scope_columns"] = scope
    scoped_options = {**options, "preprocessing": preprocessing}

    work = apply_preprocessing(df, scoped_options)
    X, y, outcome_col, predictor_cols = predictors_and_numeric_outcome(work, options)

    model_id = str(options.get("model", "linear_regression"))
    if model_id not in VALID_MODELS:
        raise DataValidationError(
            f"Unknown model '{model_id}'. Choose one of: {', '.join(sorted(VALID_MODELS))}"
        )

    training = options.get("training") or {}
    features = options.get("features") or {}
    random_state = int(options.get("random_state", 42))
    test_size = float(options.get("test_size", 0.2))
    cv_folds = int(options.get("cv_folds", 5))
    validation_strategy = str(training.get("validation_strategy", "kfold"))
    scale_features = bool(
        options.get("scale_features", features.get("scale_features", model_id in MODELS_NEEDING_SCALE))
    )
    scaler_type = str(options.get("scaler_type", features.get("scaler_type", "standard")))
    auto_remove = bool(features.get("auto_remove_low_importance", False))
    hyperparameters = options.get("hyperparameters")
    if hyperparameters is not None and not isinstance(hyperparameters, dict):
        raise DataValidationError("hyperparameters must be an object")

    X, selected_predictors = apply_feature_selection(X, y.to_numpy(), auto_remove)
    predictor_cols = selected_predictors
    X_values = X.to_numpy(dtype=float)
    y_values = y.to_numpy(dtype=float)
    eval_mode = "train-test split"
    tuning_note = ""
    y_eval = y_values
    y_pred: np.ndarray

    if test_size > 0 and len(X_values) >= 10:
        X_train, X_eval, y_train, y_eval = train_test_split(
            X_values,
            y_values,
            test_size=min(test_size, 0.5),
            random_state=random_state,
        )
        if scale_features:
            scaler = get_scaler(scaler_type)
            X_train = scaler.fit_transform(X_train)
            X_eval = scaler.transform(X_eval)
        model, tuning_note = _fit_model(model_id, hyperparameters, random_state, X_train, y_train)
        y_pred = model.predict(X_eval)
        metrics = _regression_metrics(y_eval, y_pred)
    else:
        eval_mode = f"{cv_folds}-fold {validation_strategy.replace('_', ' ')}"
        if scale_features:
            X_scaled = get_scaler(scaler_type).fit_transform(X_values)
        else:
            X_scaled = X_values
        model, tuning_note = _fit_model(
            model_id,
            hyperparameters,
            random_state,
            X_scaled,
            y_values,
        )
        cv = _build_cv(validation_strategy, min(cv_folds, len(y_values)), random_state)
        scoring = ["r2", "neg_mean_absolute_error", "neg_mean_squared_error"]
        cv_result = cross_validate(model, X_scaled, y_values, cv=cv, scoring=scoring, n_jobs=1)
        metrics = {
            "r2": float(cv_result["test_r2"].mean()),
            "mae": float(-cv_result["test_neg_mean_absolute_error"].mean()),
            "mse": float(-cv_result["test_neg_mean_squared_error"].mean()),
            "rmse": float(np.sqrt(-cv_result["test_neg_mean_squared_error"].mean())),
        }
        model.fit(X_scaled, y_values)
        y_pred = model.predict(X_scaled)
        y_eval = y_values

    chart_data = _prediction_chart(y_eval, y_pred)
    model_label = MODEL_LABELS[model_id]
    stats_list = [
        StatResult(label="Model", value=model_label),
        StatResult(label="Outcome (Y)", value=outcome_col),
        StatResult(label="Predictors", value=", ".join(predictor_cols)),
        StatResult(label="N", value=str(len(X))),
        StatResult(label="Evaluation", value=eval_mode),
        StatResult(label="Tuning", value=tuning_note or "Manual hyperparameters"),
        StatResult(label="Test size", value=f"{test_size:.0%}" if test_size > 0 else "CV only"),
        StatResult(label="R²", value=f"{metrics['r2']:.4f}"),
        StatResult(label="MAE", value=f"{metrics['mae']:.4f}"),
        StatResult(label="RMSE", value=f"{metrics['rmse']:.4f}"),
        StatResult(label="MSE", value=f"{metrics['mse']:.4f}"),
    ]

    interpretation = (
        f"{model_label} trained on {len(X)} rows using {', '.join(predictor_cols)} "
        f"to predict {outcome_col}. Evaluation: {eval_mode}. "
        f"R² = {metrics['r2']:.3f}, RMSE = {metrics['rmse']:.3f}, MAE = {metrics['mae']:.3f}."
    )

    return AnalysisResponse(
        test_id="regression-models",
        title=f"Regression — {model_label}",
        stats=stats_list,
        interpretation=interpretation,
        chart_data=chart_data,
    )
