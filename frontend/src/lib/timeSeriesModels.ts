export type ParamType = "number" | "select" | "boolean";

export type ModelParamOption = {
  value: string;
  label: string;
};

export type ModelParam = {
  key: string;
  label: string;
  type: ParamType;
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: ModelParamOption[];
  help?: string;
};

export type TimeSeriesModelId = "arima" | "sarima" | "ets" | "cnn_1d" | "lstm" | "gru";

export type TimeSeriesModelDefinition = {
  id: TimeSeriesModelId;
  label: string;
  description: string;
  params: ModelParam[];
};

export type TimeSeriesOptions = {
  model: TimeSeriesModelId;
  forecast_horizon: number;
  random_state: number;
  hyperparameters: Record<string, number | string | boolean>;
};

export const GENERAL_CONTROLS: ModelParam[] = [
  {
    key: "forecast_horizon",
    label: "Forecast horizon",
    type: "number",
    default: 6,
    min: 1,
    max: 60,
    step: 1,
    help: "Number of future/hold-out steps to forecast and evaluate.",
  },
  {
    key: "random_state",
    label: "Random seed",
    type: "number",
    default: 42,
    min: 0,
    max: 9999,
    step: 1,
    help: "Used for deep learning models (CNN, LSTM, GRU).",
  },
];

export const TIME_SERIES_MODELS: TimeSeriesModelDefinition[] = [
  {
    id: "arima",
    label: "ARIMA",
    description: "AutoRegressive Integrated Moving Average for univariate forecasting.",
    params: [
      { key: "p", label: "AR order (p)", type: "number", default: 1, min: 0, max: 5, step: 1 },
      { key: "d", label: "Differencing (d)", type: "number", default: 1, min: 0, max: 2, step: 1 },
      { key: "q", label: "MA order (q)", type: "number", default: 1, min: 0, max: 5, step: 1 },
    ],
  },
  {
    id: "sarima",
    label: "SARIMA",
    description: "Seasonal ARIMA for data with recurring patterns.",
    params: [
      { key: "p", label: "AR order (p)", type: "number", default: 1, min: 0, max: 3, step: 1 },
      { key: "d", label: "Differencing (d)", type: "number", default: 1, min: 0, max: 2, step: 1 },
      { key: "q", label: "MA order (q)", type: "number", default: 1, min: 0, max: 3, step: 1 },
      { key: "P", label: "Seasonal AR (P)", type: "number", default: 1, min: 0, max: 2, step: 1 },
      { key: "D", label: "Seasonal diff (D)", type: "number", default: 1, min: 0, max: 1, step: 1 },
      { key: "Q", label: "Seasonal MA (Q)", type: "number", default: 1, min: 0, max: 2, step: 1 },
      { key: "seasonal_period", label: "Seasonal period", type: "number", default: 12, min: 2, max: 52, step: 1 },
    ],
  },
  {
    id: "ets",
    label: "Exponential Smoothing (ETS)",
    description: "Error-Trend-Seasonality smoothing (Holt-Winters).",
    params: [
      {
        key: "trend",
        label: "Trend",
        type: "select",
        default: "add",
        options: [
          { value: "add", label: "Additive" },
          { value: "none", label: "None" },
        ],
      },
      {
        key: "seasonal",
        label: "Seasonality",
        type: "select",
        default: "add",
        options: [
          { value: "add", label: "Additive" },
          { value: "none", label: "None" },
        ],
      },
      { key: "seasonal_period", label: "Seasonal period", type: "number", default: 12, min: 2, max: 52, step: 1 },
    ],
  },
  {
    id: "cnn_1d",
    label: "1D CNN",
    description: "Convolutional neural network for sequence-based forecasting.",
    params: [
      { key: "lookback", label: "Lookback window", type: "number", default: 12, min: 3, max: 60, step: 1 },
      { key: "filters", label: "Filters", type: "number", default: 32, min: 8, max: 128, step: 8 },
      { key: "kernel_size", label: "Kernel size", type: "number", default: 3, min: 2, max: 7, step: 1 },
      { key: "epochs", label: "Epochs", type: "number", default: 50, min: 10, max: 200, step: 10 },
      { key: "batch_size", label: "Batch size", type: "number", default: 16, min: 4, max: 64, step: 4 },
    ],
  },
  {
    id: "lstm",
    label: "LSTM",
    description: "Long Short-Term Memory recurrent network.",
    params: [
      { key: "lookback", label: "Lookback window", type: "number", default: 12, min: 3, max: 60, step: 1 },
      { key: "units", label: "LSTM units", type: "number", default: 32, min: 8, max: 128, step: 8 },
      { key: "epochs", label: "Epochs", type: "number", default: 50, min: 10, max: 200, step: 10 },
      { key: "batch_size", label: "Batch size", type: "number", default: 16, min: 4, max: 64, step: 4 },
    ],
  },
  {
    id: "gru",
    label: "GRU",
    description: "Gated Recurrent Unit network for sequences.",
    params: [
      { key: "lookback", label: "Lookback window", type: "number", default: 12, min: 3, max: 60, step: 1 },
      { key: "units", label: "GRU units", type: "number", default: 32, min: 8, max: 128, step: 8 },
      { key: "epochs", label: "Epochs", type: "number", default: 50, min: 10, max: 200, step: 10 },
      { key: "batch_size", label: "Batch size", type: "number", default: 16, min: 4, max: 64, step: 4 },
    ],
  },
];

export function getTimeSeriesModel(id: TimeSeriesModelId) {
  return TIME_SERIES_MODELS.find((model) => model.id === id) ?? TIME_SERIES_MODELS[0];
}

export function getDefaultHyperparameters(modelId: TimeSeriesModelId) {
  const model = getTimeSeriesModel(modelId);
  const hyperparameters: Record<string, number | string | boolean> = {};
  for (const param of model.params) {
    hyperparameters[param.key] = param.default;
  }
  return hyperparameters;
}

export function getDefaultTimeSeriesOptions(): TimeSeriesOptions {
  const model = TIME_SERIES_MODELS[0];
  return {
    model: model.id,
    forecast_horizon: 6,
    random_state: 42,
    hyperparameters: getDefaultHyperparameters(model.id),
  };
}

export function validateTimeSeriesOptions(options: TimeSeriesOptions): string | null {
  if (options.forecast_horizon < 1 || options.forecast_horizon > 60) {
    return "Forecast horizon must be between 1 and 60.";
  }
  return null;
}
