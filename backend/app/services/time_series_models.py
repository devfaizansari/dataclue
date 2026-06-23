from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.statespace.sarimax import SARIMAX

from app.core.exceptions import DataValidationError
from app.schemas.common import AnalysisResponse, StatResult
from app.services.column_utils import parse_time_series
from app.services.ml_preprocessing import apply_preprocessing

try:
    import tensorflow as tf
    from tensorflow.keras import layers, models

    tf.get_logger().setLevel("ERROR")
except ImportError:  # pragma: no cover
    tf = None  # type: ignore[assignment]
    layers = None  # type: ignore[assignment]
    models = None  # type: ignore[assignment]

VALID_MODELS = frozenset({"arima", "sarima", "ets", "cnn_1d", "lstm", "gru"})

MODEL_LABELS = {
    "arima": "ARIMA",
    "sarima": "SARIMA",
    "ets": "Exponential Smoothing (ETS)",
    "cnn_1d": "1D CNN",
    "lstm": "LSTM",
    "gru": "GRU",
}

DEEP_MODELS = frozenset({"cnn_1d", "lstm", "gru"})


def _hp(hyperparameters: dict[str, Any] | None, key: str, default: Any) -> Any:
    if not hyperparameters:
        return default
    value = hyperparameters.get(key, default)
    return default if value is None or value == "" else value


def _int_hp(hyperparameters: dict[str, Any] | None, key: str, default: int) -> int:
    return int(_hp(hyperparameters, key, default))


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    mse = float(mean_squared_error(y_true, y_pred))
    mape = float(np.mean(np.abs((y_true - y_pred) / np.where(y_true == 0, 1e-9, y_true))) * 100)
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "mse": mse,
        "rmse": float(np.sqrt(mse)),
        "mape": mape,
    }


def _chart_payload(
    dates: list[str],
    actual: list[float],
    predicted: list[float | None],
    train_size: int,
) -> dict[str, Any]:
    return {
        "time_series": {
            "dates": dates,
            "actual": actual,
            "predicted": predicted,
            "train_size": train_size,
        }
    }


def _resolve_horizon(options: dict, series_len: int) -> int:
    horizon = int(options.get("forecast_horizon", 0))
    if horizon <= 0:
        horizon = max(3, min(12, series_len // 5))
    if horizon >= series_len:
        raise DataValidationError(
            f"Forecast horizon ({horizon}) must be smaller than the number of observations ({series_len})"
        )
    return horizon


def _fit_arima(train: np.ndarray, hp: dict[str, Any]) -> Any:
    order = (
        _int_hp(hp, "p", 1),
        _int_hp(hp, "d", 1),
        _int_hp(hp, "q", 1),
    )
    return ARIMA(train, order=order).fit()


def _fit_sarima(train: np.ndarray, hp: dict[str, Any]) -> Any:
    order = (
        _int_hp(hp, "p", 1),
        _int_hp(hp, "d", 1),
        _int_hp(hp, "q", 1),
    )
    seasonal_period = _int_hp(hp, "seasonal_period", 12)
    seasonal_order = (
        _int_hp(hp, "P", 1),
        _int_hp(hp, "D", 1),
        _int_hp(hp, "Q", 1),
        seasonal_period,
    )
    return SARIMAX(train, order=order, seasonal_order=seasonal_order).fit(disp=False)


def _fit_ets(train: np.ndarray, hp: dict[str, Any]) -> Any:
    trend = str(_hp(hp, "trend", "add"))
    seasonal = str(_hp(hp, "seasonal", "add"))
    if seasonal == "none":
        seasonal = None
    if trend == "none":
        trend = None
    seasonal_periods = _int_hp(hp, "seasonal_period", 12)
    kwargs: dict[str, Any] = {}
    if seasonal is not None:
        kwargs["seasonal_periods"] = seasonal_periods
    return ExponentialSmoothing(train, trend=trend, seasonal=seasonal, **kwargs).fit(optimized=True)


def _create_sequences(values: np.ndarray, lookback: int) -> tuple[np.ndarray, np.ndarray]:
    x_rows: list[np.ndarray] = []
    y_rows: list[float] = []
    for idx in range(lookback, len(values)):
        x_rows.append(values[idx - lookback : idx])
        y_rows.append(float(values[idx]))
    return np.array(x_rows), np.array(y_rows)


def _require_tensorflow() -> None:
    if tf is None or models is None or layers is None:
        raise DataValidationError(
            "TensorFlow is not installed on the server. Install tensorflow to use CNN/LSTM/GRU models."
        )


def _build_deep_model(model_id: str, lookback: int, hp: dict[str, Any]):
    _require_tensorflow()
    units = _int_hp(hp, "units", 32)
    inputs = tf.keras.Input(shape=(lookback, 1))
    x = inputs
    if model_id == "cnn_1d":
        filters = _int_hp(hp, "filters", 32)
        kernel_size = _int_hp(hp, "kernel_size", 3)
        x = layers.Conv1D(filters=filters, kernel_size=kernel_size, activation="relu", padding="causal")(x)
        x = layers.MaxPooling1D(pool_size=2)(x)
        x = layers.Flatten()(x)
    elif model_id == "lstm":
        x = layers.LSTM(units)(x)
    else:
        x = layers.GRU(units)(x)
    x = layers.Dense(16, activation="relu")(x)
    outputs = layers.Dense(1)(x)
    model = models.Model(inputs=inputs, outputs=outputs)
    model.compile(optimizer="adam", loss="mse")
    return model


def _fit_deep_and_forecast(
    train: np.ndarray,
    test: np.ndarray,
    model_id: str,
    hp: dict[str, Any],
    random_state: int,
) -> np.ndarray:
    _require_tensorflow()
    lookback = _int_hp(hp, "lookback", min(12, max(3, len(train) // 4)))
    epochs = _int_hp(hp, "epochs", 50)
    batch_size = _int_hp(hp, "batch_size", 16)

    if len(train) <= lookback + 2:
        raise DataValidationError(
            f"Need more training rows than lookback window ({lookback}) for deep learning models"
        )

    tf.random.set_seed(random_state)
    x_train, y_train = _create_sequences(train, lookback)
    x_train = x_train.reshape((x_train.shape[0], x_train.shape[1], 1))

    model = _build_deep_model(model_id, lookback, hp)
    model.fit(x_train, y_train, epochs=epochs, batch_size=batch_size, verbose=0)

    history = train.tolist()
    preds: list[float] = []
    for _ in range(len(test)):
        window = np.array(history[-lookback:], dtype=float).reshape(1, lookback, 1)
        next_val = float(model.predict(window, verbose=0)[0, 0])
        preds.append(next_val)
        history.append(next_val)
    return np.array(preds, dtype=float)


def time_series_models(df: pd.DataFrame, options: dict) -> AnalysisResponse:
    scope_cols: list[str] = []
    for key in ("date_column", "value_column"):
        val = options.get(key)
        if val and str(val) in df.columns:
            scope_cols.append(str(val))

    preprocessing = dict(options.get("preprocessing") or {})
    if scope_cols:
        preprocessing["scope_columns"] = scope_cols
    scoped_options = {**options, "preprocessing": preprocessing}

    work = apply_preprocessing(df, scoped_options)
    series, date_col, value_col = parse_time_series(work, options)

    model_id = str(options.get("model", "arima"))
    if model_id not in VALID_MODELS:
        raise DataValidationError(
            f"Unknown model '{model_id}'. Choose one of: {', '.join(sorted(VALID_MODELS))}"
        )

    hyperparameters = options.get("hyperparameters")
    if hyperparameters is not None and not isinstance(hyperparameters, dict):
        raise DataValidationError("hyperparameters must be an object")
    hp = hyperparameters or {}

    random_state = int(options.get("random_state", 42))
    values = series.to_numpy(dtype=float)
    n = len(values)
    if n < 12:
        raise DataValidationError("Time series forecasting needs at least 12 observations")

    horizon = _resolve_horizon(options, n)
    train = values[:-horizon]
    test = values[-horizon:]
    date_labels = [str(d) for d in series.index]

    try:
        if model_id == "arima":
            fitted = _fit_arima(train, hp)
            preds = np.asarray(fitted.forecast(steps=horizon), dtype=float)
        elif model_id == "sarima":
            fitted = _fit_sarima(train, hp)
            preds = np.asarray(fitted.forecast(steps=horizon), dtype=float)
        elif model_id == "ets":
            fitted = _fit_ets(train, hp)
            preds = np.asarray(fitted.forecast(steps=horizon), dtype=float)
        else:
            preds = _fit_deep_and_forecast(train, test, model_id, hp, random_state)
    except DataValidationError:
        raise
    except Exception as exc:  # pragma: no cover - model-specific failures
        raise DataValidationError(f"Model fitting failed: {exc}") from exc

    metrics = _metrics(test, preds)
    predicted_full: list[float | None] = [None] * (n - horizon) + preds.tolist()
    chart_data = _chart_payload(date_labels, values.tolist(), predicted_full, n - horizon)

    model_label = MODEL_LABELS[model_id]
    stats_list = [
        StatResult(label="Model", value=model_label),
        StatResult(label="Date column", value=date_col),
        StatResult(label="Value column", value=value_col),
        StatResult(label="Observations", value=str(n)),
        StatResult(label="Train size", value=str(len(train))),
        StatResult(label="Forecast horizon", value=str(horizon)),
        StatResult(label="R²", value=f"{metrics['r2']:.4f}"),
        StatResult(label="MAE", value=f"{metrics['mae']:.4f}"),
        StatResult(label="RMSE", value=f"{metrics['rmse']:.4f}"),
        StatResult(label="MAPE", value=f"{metrics['mape']:.2f}%"),
    ]

    interpretation = (
        f"{model_label} forecast on {value_col} indexed by {date_col}. "
        f"Trained on {len(train)} points, evaluated on the last {horizon} hold-out points. "
        f"RMSE = {metrics['rmse']:.3f}, MAE = {metrics['mae']:.3f}, MAPE = {metrics['mape']:.1f}%."
    )

    return AnalysisResponse(
        test_id="time-series-models",
        title=f"Time Series — {model_label}",
        stats=stats_list,
        interpretation=interpretation,
        chart_data=chart_data,
    )
