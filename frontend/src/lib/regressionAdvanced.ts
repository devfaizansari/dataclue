import type { RegressionModelId } from "@/lib/regressionModels";
import {
  getDefaultRegressionOptions,
  getDefaultHyperparameters,
  type RegressionOptions,
} from "@/lib/regressionModels";

export type MissingValuesStrategy = "drop" | "impute_mean" | "impute_median" | "none";
export type ValidationStrategy = "kfold" | "shuffle_split";
export type ScalerType = "standard" | "minmax" | "robust";

export type PreprocessingSettings = {
  missingValues: MissingValuesStrategy;
  columnTypes: Record<string, "numeric" | "categorical">;
};

export type AdvancedTrainingSettings = {
  validationStrategy: ValidationStrategy;
};

export type FeatureEngineeringSettings = {
  scaleFeatures: boolean;
  scalerType: ScalerType;
  autoRemoveLowImportance: boolean;
};

export type RegressionAdvancedState = {
  showAdvanced: boolean;
  preprocessing: PreprocessingSettings;
  training: AdvancedTrainingSettings;
  features: FeatureEngineeringSettings;
};

export function getDefaultAdvancedState(): RegressionAdvancedState {
  return {
    showAdvanced: false,
    preprocessing: {
      missingValues: "drop",
      columnTypes: {},
    },
    training: {
      validationStrategy: "kfold",
    },
    features: {
      scaleFeatures: true,
      scalerType: "standard",
      autoRemoveLowImportance: false,
    },
  };
}

export function buildRegressionPayload(
  options: RegressionOptions,
  advanced: RegressionAdvancedState,
) {
  const hyperparameters = { ...options.hyperparameters };
  if ("max_depth" in hyperparameters && Number(hyperparameters.max_depth) === 0) {
    hyperparameters.max_depth = "none";
  }

  return {
    model: options.model,
    test_size: options.test_size,
    random_state: options.random_state,
    cv_folds: options.cv_folds,
    scale_features: advanced.features.scaleFeatures,
    scaler_type: advanced.features.scalerType,
    preprocessing: {
      missing_values: advanced.preprocessing.missingValues,
      column_types: advanced.preprocessing.columnTypes,
    },
    training: {
      validation_strategy: advanced.training.validationStrategy,
    },
    features: {
      auto_remove_low_importance: advanced.features.autoRemoveLowImportance,
    },
    hyperparameters,
  };
}

export function resetAdvancedForModel(
  modelId: RegressionModelId,
  prev: RegressionAdvancedState,
): RegressionAdvancedState {
  const needsScale = [
    "linear_regression",
    "ridge",
    "lasso",
    "elastic_net",
    "knn",
    "svr",
  ].includes(modelId);

  return {
    ...prev,
    features: {
      ...prev.features,
      scaleFeatures: needsScale,
    },
  };
}

export { getDefaultRegressionOptions, getDefaultHyperparameters };
