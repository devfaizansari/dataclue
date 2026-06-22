from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import (
    GridSearchCV,
    KFold,
    ShuffleSplit,
    StratifiedKFold,
    cross_validate,
    train_test_split,
)
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from app.core.exceptions import DataValidationError
from app.schemas.common import AnalysisResponse, StatResult
from app.services.column_utils import predictors_and_binary_outcome
from app.services.ml_preprocessing import apply_feature_selection, apply_preprocessing, get_scaler

try:
    from imblearn.over_sampling import SMOTE
    from imblearn.under_sampling import RandomUnderSampler
except ImportError:  # pragma: no cover
    SMOTE = None  # type: ignore[misc, assignment]
    RandomUnderSampler = None  # type: ignore[misc, assignment]

try:
    from xgboost import XGBClassifier
except ImportError:  # pragma: no cover
    XGBClassifier = None  # type: ignore[misc, assignment]

VALID_MODELS = frozenset(
    {
        "logistic_regression",
        "knn",
        "gaussian_nb",
        "svc",
        "decision_tree",
        "random_forest",
        "xgboost",
        "gradient_boosting",
        "adaboost",
    }
)

MODEL_LABELS = {
    "logistic_regression": "Logistic Regression",
    "knn": "K-Nearest Neighbors",
    "gaussian_nb": "Gaussian Naive Bayes",
    "svc": "Support Vector Classifier",
    "decision_tree": "Decision Tree",
    "random_forest": "Random Forest",
    "xgboost": "XGBoost",
    "gradient_boosting": "Gradient Boosting",
    "adaboost": "AdaBoost",
}

MODELS_NEEDING_SCALE = frozenset({"logistic_regression", "knn", "svc"})


def _hp(hyperparameters: dict[str, Any] | None, key: str, default: Any) -> Any:
    if not hyperparameters:
        return default
    value = hyperparameters.get(key, default)
    return default if value is None or value == "" else value


def _optional_int(value: Any) -> int | None:
    if value is None or value == "" or str(value).lower() == "none":
        return None
    return int(value)


def _adaboost_base_estimator(base_estimator: str, random_state: int):
    depth = 2 if base_estimator == "depth_2" else 1
    return DecisionTreeClassifier(max_depth=depth, random_state=random_state)


def build_classifier(model_id: str, hyperparameters: dict[str, Any] | None, random_state: int):
    hp = hyperparameters or {}

    if model_id == "logistic_regression":
        penalty = str(_hp(hp, "penalty", "l2"))
        solver = "liblinear" if penalty == "l1" else "lbfgs"
        return LogisticRegression(
            C=float(_hp(hp, "C", 1.0)),
            max_iter=int(_hp(hp, "max_iter", 1000)),
            penalty=penalty,
            solver=solver,
            random_state=random_state,
        )

    if model_id == "knn":
        return KNeighborsClassifier(
            n_neighbors=max(1, int(_hp(hp, "n_neighbors", 5))),
            weights=str(_hp(hp, "weights", "uniform")),
            metric=str(_hp(hp, "metric", "minkowski")),
        )

    if model_id == "gaussian_nb":
        return GaussianNB(var_smoothing=float(_hp(hp, "var_smoothing", 1e-9)))

    if model_id == "svc":
        gamma_value = _hp(hp, "gamma", "scale")
        gamma: str | float = gamma_value if gamma_value in {"scale", "auto"} else float(gamma_value)
        return SVC(
            C=float(_hp(hp, "C", 1.0)),
            kernel=str(_hp(hp, "kernel", "rbf")),
            gamma=gamma,
            probability=True,
            random_state=random_state,
        )

    if model_id == "decision_tree":
        return DecisionTreeClassifier(
            max_depth=_optional_int(_hp(hp, "max_depth", None)),
            min_samples_split=max(2, int(_hp(hp, "min_samples_split", 2))),
            criterion=str(_hp(hp, "criterion", "gini")),
            random_state=random_state,
        )

    if model_id == "random_forest":
        return RandomForestClassifier(
            n_estimators=max(1, int(_hp(hp, "n_estimators", 100))),
            max_depth=_optional_int(_hp(hp, "max_depth", None)),
            min_samples_split=max(2, int(_hp(hp, "min_samples_split", 2))),
            random_state=random_state,
        )

    if model_id == "xgboost":
        if XGBClassifier is None:
            raise DataValidationError(
                "XGBoost is not installed on the server. Choose another model or install xgboost."
            )
        return XGBClassifier(
            n_estimators=max(1, int(_hp(hp, "n_estimators", 100))),
            max_depth=max(1, int(_hp(hp, "max_depth", 6))),
            learning_rate=float(_hp(hp, "learning_rate", 0.1)),
            subsample=float(_hp(hp, "subsample", 1.0)),
            random_state=random_state,
            eval_metric="logloss",
        )

    if model_id == "gradient_boosting":
        return GradientBoostingClassifier(
            n_estimators=max(1, int(_hp(hp, "n_estimators", 100))),
            max_depth=max(1, int(_hp(hp, "max_depth", 3))),
            learning_rate=float(_hp(hp, "learning_rate", 0.1)),
            random_state=random_state,
        )

    if model_id == "adaboost":
        base = _adaboost_base_estimator(str(_hp(hp, "base_estimator", "depth_1")), random_state)
        return AdaBoostClassifier(
            estimator=base,
            n_estimators=max(1, int(_hp(hp, "n_estimators", 50))),
            learning_rate=float(_hp(hp, "learning_rate", 1.0)),
            random_state=random_state,
        )

    raise DataValidationError(f"Unknown classification model '{model_id}'")


def _build_cv(strategy: str, folds: int, random_state: int):
    if strategy == "shuffle_split":
        return ShuffleSplit(n_splits=folds, test_size=0.2, random_state=random_state)
    if strategy == "stratified_kfold":
        return StratifiedKFold(n_splits=folds, shuffle=True, random_state=random_state)
    return KFold(n_splits=folds, shuffle=True, random_state=random_state)


def _apply_imbalance(X: np.ndarray, y: np.ndarray, strategy: str) -> tuple[np.ndarray, np.ndarray]:
    if strategy == "none":
        return X, y
    if strategy == "smote":
        if SMOTE is None:
            raise DataValidationError("SMOTE requires imbalanced-learn on the server.")
        return SMOTE(random_state=42).fit_resample(X, y)
    if strategy == "undersample":
        if RandomUnderSampler is None:
            raise DataValidationError("Undersampling requires imbalanced-learn on the server.")
        return RandomUnderSampler(random_state=42).fit_resample(X, y)
    raise DataValidationError(f"Unknown imbalance strategy '{strategy}'")


def _fit_model(
    model_id: str,
    hyperparameters: dict[str, Any] | None,
    random_state: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
):
    hp = dict(hyperparameters or {})
    if model_id == "adaboost" and str(hp.get("tuning_mode", "manual")) == "grid_search":
        grid = hp.get("grid_search") or {}
        param_grid: dict[str, list[Any]] = {}
        if grid.get("n_estimators"):
            param_grid["n_estimators"] = [int(v) for v in grid["n_estimators"]]
        if grid.get("learning_rate"):
            param_grid["learning_rate"] = [float(v) for v in grid["learning_rate"]]
        if not param_grid:
            param_grid = {"n_estimators": [50, 100], "learning_rate": [0.5, 1.0]}
        base = build_classifier(model_id, hp, random_state)
        search = GridSearchCV(base, param_grid, cv=3, n_jobs=1)
        search.fit(X_train, y_train)
        return search.best_estimator_, f"GridSearch ({search.best_params_})"

    model = build_classifier(model_id, hp, random_state)
    model.fit(X_train, y_train)
    return model, "Manual hyperparameters"


def _analysis_columns(df: pd.DataFrame, options: dict) -> list[str]:
    columns: list[str] = []
    outcome = options.get("outcome_column")
    if outcome and str(outcome) in df.columns:
        columns.append(str(outcome))

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


def classification_models(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    scope = _analysis_columns(df, options)
    preprocessing = dict(options.get("preprocessing") or {})
    if scope:
        preprocessing["scope_columns"] = scope
    scoped_options = {**options, "preprocessing": preprocessing}

    work = apply_preprocessing(df, scoped_options)
    X, y_raw, outcome_col, predictor_cols = predictors_and_binary_outcome(work, options)
    categories = list(pd.Categorical(y_raw).categories)
    y = pd.Categorical(y_raw).codes
    n_classes = len(np.unique(y))
    if n_classes < 2:
        raise DataValidationError("Classification needs an outcome column with at least 2 classes")

    model_id = str(options.get("model", "logistic_regression"))
    if model_id not in VALID_MODELS:
        raise DataValidationError(
            f"Unknown model '{model_id}'. Choose one of: {', '.join(sorted(VALID_MODELS))}"
        )

    training = options.get("training") or {}
    features = options.get("features") or {}
    random_state = int(options.get("random_state", 42))
    test_size = float(options.get("test_size", 0.2))
    cv_folds = int(options.get("cv_folds", 5))
    validation_strategy = str(training.get("validation_strategy", "stratified_kfold"))
    imbalance_handling = str(training.get("imbalance_handling", "none"))
    scale_features = bool(
        options.get("scale_features", features.get("scale_features", model_id in MODELS_NEEDING_SCALE))
    )
    scaler_type = str(options.get("scaler_type", features.get("scaler_type", "standard")))
    auto_remove = bool(features.get("auto_remove_low_importance", False))
    threshold = float(options.get("probability_threshold", 0.5))
    hyperparameters = options.get("hyperparameters")
    if hyperparameters is not None and not isinstance(hyperparameters, dict):
        raise DataValidationError("hyperparameters must be an object")

    X, selected_predictors = apply_feature_selection(X, y, auto_remove)
    predictor_cols = selected_predictors
    X_values = X.to_numpy(dtype=float)
    eval_mode = "train-test split"
    tuning_note = ""
    y_eval = y
    y_pred: np.ndarray
    proba_for_roc: np.ndarray | None = None

    if test_size > 0 and len(X_values) >= 10:
        stratify = y if n_classes >= 2 and len(X_values) >= n_classes * 2 else None
        X_train, X_eval, y_train, y_eval = train_test_split(
            X_values,
            y,
            test_size=min(test_size, 0.5),
            random_state=random_state,
            stratify=stratify,
        )
        X_train, y_train = _apply_imbalance(X_train, y_train, imbalance_handling)
        if scale_features:
            scaler = get_scaler(scaler_type)
            X_train = scaler.fit_transform(X_train)
            X_eval = scaler.transform(X_eval)
        model, tuning_note = _fit_model(model_id, hyperparameters, random_state, X_train, y_train)
        if n_classes == 2 and hasattr(model, "predict_proba"):
            proba_for_roc = model.predict_proba(X_eval)[:, 1]
            y_pred = (proba_for_roc >= threshold).astype(int)
        else:
            y_pred = model.predict(X_eval)
        average = "binary" if n_classes == 2 else "weighted"
        metrics = {
            "accuracy": float(accuracy_score(y_eval, y_pred)),
            "precision": float(precision_score(y_eval, y_pred, average=average, zero_division=0)),
            "recall": float(recall_score(y_eval, y_pred, average=average, zero_division=0)),
            "f1": float(f1_score(y_eval, y_pred, average=average, zero_division=0)),
        }
        if proba_for_roc is not None:
            metrics["auc"] = float(roc_auc_score(y_eval, proba_for_roc))
    else:
        eval_mode = f"{cv_folds}-fold {validation_strategy.replace('_', ' ')}"
        if scale_features:
            X_scaled = get_scaler(scaler_type).fit_transform(X_values)
        else:
            X_scaled = X_values
        X_resampled, y_resampled = _apply_imbalance(X_scaled, y, imbalance_handling)
        model, tuning_note = _fit_model(
            model_id,
            hyperparameters,
            random_state,
            X_resampled,
            y_resampled,
        )
        cv = _build_cv(validation_strategy, min(cv_folds, len(y)), random_state)
        scoring = ["accuracy", "precision_weighted", "recall_weighted", "f1_weighted"]
        cv_result = cross_validate(model, X_scaled, y, cv=cv, scoring=scoring, n_jobs=1)
        metrics = {
            "accuracy": float(cv_result["test_accuracy"].mean()),
            "precision": float(cv_result["test_precision_weighted"].mean()),
            "recall": float(cv_result["test_recall_weighted"].mean()),
            "f1": float(cv_result["test_f1_weighted"].mean()),
        }
        model.fit(X_resampled, y_resampled)
        if n_classes == 2 and hasattr(model, "predict_proba"):
            proba_for_roc = model.predict_proba(X_scaled)[:, 1]
            y_pred = (proba_for_roc >= threshold).astype(int)
            y_eval = y
            metrics["auc"] = float(roc_auc_score(y, proba_for_roc))
        else:
            y_pred = model.predict(X_scaled)
            y_eval = y

    cm = confusion_matrix(y_eval, y_pred, labels=list(range(n_classes)))
    chart_data: dict[str, Any] = {
        "confusion_matrix": {
            "labels": [str(label) for label in categories],
            "matrix": cm.tolist(),
        },
        "probability_threshold": threshold,
    }
    if proba_for_roc is not None and n_classes == 2:
        fpr, tpr, _ = roc_curve(y_eval, proba_for_roc)
        chart_data["roc"] = [
            {"fpr": float(a), "tpr": float(b)} for a, b in zip(fpr, tpr, strict=False)
        ]
        chart_data["threshold_data"] = {
            "y_true": [int(v) for v in y_eval.tolist()],
            "y_proba": [float(v) for v in proba_for_roc.tolist()],
            "labels": [str(label) for label in categories[:2]],
        }

    model_label = MODEL_LABELS[model_id]
    stats_list = [
        StatResult(label="Model", value=model_label),
        StatResult(label="Outcome", value=outcome_col),
        StatResult(label="Predictors", value=", ".join(predictor_cols)),
        StatResult(label="N", value=str(len(X))),
        StatResult(label="Classes", value=str(n_classes)),
        StatResult(label="Evaluation", value=eval_mode),
        StatResult(label="Tuning", value=tuning_note or "Manual hyperparameters"),
        StatResult(label="Test size", value=f"{test_size:.0%}" if test_size > 0 else "CV only"),
        StatResult(label="Threshold", value=f"{threshold:.2f}"),
        StatResult(label="Accuracy", value=f"{metrics['accuracy']:.4f}"),
        StatResult(label="Precision", value=f"{metrics['precision']:.4f}"),
        StatResult(label="Recall", value=f"{metrics['recall']:.4f}"),
        StatResult(label="F1 Score", value=f"{metrics['f1']:.4f}"),
    ]
    if "auc" in metrics:
        stats_list.append(StatResult(label="AUC", value=f"{metrics['auc']:.4f}"))

    interpretation = (
        f"{model_label} trained on {len(X)} rows using {', '.join(predictor_cols)} "
        f"to predict {outcome_col}. Evaluation: {eval_mode}. "
        f"Accuracy = {metrics['accuracy']:.3f}, F1 = {metrics['f1']:.3f}"
        + (f", AUC = {metrics['auc']:.3f}." if "auc" in metrics else ".")
    )

    return AnalysisResponse(
        test_id="classification-models",
        title=f"Classification — {model_label}",
        stats=stats_list,
        interpretation=interpretation,
        chart_data=chart_data,
    )
