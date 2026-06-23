import type { TimeSeriesModelId } from "@/lib/timeSeriesModels";
import {
  getDefaultHyperparameters,
  getDefaultTimeSeriesOptions,
  type TimeSeriesOptions,
} from "@/lib/timeSeriesModels";

export type MissingValuesStrategy = "drop" | "impute_mean" | "impute_median" | "none";

export type PreprocessingSettings = {
  missingValues: MissingValuesStrategy;
  columnTypes: Record<string, "numeric" | "categorical">;
};

export type TimeSeriesAdvancedState = {
  showAdvanced: boolean;
  preprocessing: PreprocessingSettings;
};

export function getDefaultAdvancedState(): TimeSeriesAdvancedState {
  return {
    showAdvanced: false,
    preprocessing: {
      missingValues: "drop",
      columnTypes: {},
    },
  };
}

export function buildTimeSeriesPayload(
  options: TimeSeriesOptions,
  advanced: TimeSeriesAdvancedState,
) {
  return {
    model: options.model,
    forecast_horizon: options.forecast_horizon,
    random_state: options.random_state,
    preprocessing: {
      missing_values: advanced.preprocessing.missingValues,
      column_types: advanced.preprocessing.columnTypes,
    },
    hyperparameters: { ...options.hyperparameters },
  };
}

export function resetAdvancedForModel(
  modelId: TimeSeriesModelId,
  prev: TimeSeriesAdvancedState,
): TimeSeriesAdvancedState {
  return { ...prev };
}

export { getDefaultTimeSeriesOptions, getDefaultHyperparameters };
