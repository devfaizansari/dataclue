import type { ClassificationModelId } from "@/lib/classificationModels";
import {
  getDefaultClassificationOptions,
  getDefaultHyperparameters,
  type ClassificationOptions,
} from "@/lib/classificationModels";

export type MissingValuesStrategy = "drop" | "impute_mean" | "impute_median" | "none";
export type ValidationStrategy = "kfold" | "stratified_kfold" | "shuffle_split";
export type ImbalanceStrategy = "none" | "smote" | "undersample";
export type ScalerType =
  | "standard"
  | "minmax"
  | "robust"
  | "maxabs"
  | "quantile"
  | "power";
export type HyperparameterMode = "manual" | "grid_search";
export type AdaBoostBaseEstimator = "depth_1" | "depth_2";

export type PreprocessingSettings = {
  missingValues: MissingValuesStrategy;
  columnTypes: Record<string, "numeric" | "categorical">;
};

export type AdvancedTrainingSettings = {
  validationStrategy: ValidationStrategy;
  imbalanceHandling: ImbalanceStrategy;
};

export type FeatureEngineeringSettings = {
  scaleFeatures: boolean;
  scalerType: ScalerType;
  autoRemoveLowImportance: boolean;
};

export type AdaBoostSettings = {
  baseEstimator: AdaBoostBaseEstimator;
  hyperparameterMode: HyperparameterMode;
  gridSearchParams: {
    n_estimators: number[];
    learning_rate: number[];
  };
};

export type ClassificationAdvancedState = {
  showAdvanced: boolean;
  preprocessing: PreprocessingSettings;
  training: AdvancedTrainingSettings;
  features: FeatureEngineeringSettings;
  adaboost: AdaBoostSettings;
};

export type RunHistoryEntry = {
  id: string;
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  threshold: number;
  timestamp: string;
  stats: { label: string; value: string }[];
  interpretation: string;
  chartData: Record<string, unknown>;
  title: string;
};

export function getDefaultAdvancedState(): ClassificationAdvancedState {
  return {
    showAdvanced: false,
    preprocessing: {
      missingValues: "drop",
      columnTypes: {},
    },
    training: {
      validationStrategy: "stratified_kfold",
      imbalanceHandling: "none",
    },
    features: {
      scaleFeatures: true,
      scalerType: "standard",
      autoRemoveLowImportance: false,
    },
    adaboost: {
      baseEstimator: "depth_1",
      hyperparameterMode: "manual",
      gridSearchParams: {
        n_estimators: [50, 100],
        learning_rate: [0.5, 1.0],
      },
    },
  };
}

export function buildClassificationPayload(
  options: ClassificationOptions,
  advanced: ClassificationAdvancedState,
  threshold = 0.5,
) {
  const hyperparameters = { ...options.hyperparameters };
  if ("max_depth" in hyperparameters && Number(hyperparameters.max_depth) === 0) {
    hyperparameters.max_depth = "none";
  }

  if (options.model === "adaboost") {
    hyperparameters.base_estimator = advanced.adaboost.baseEstimator;
    hyperparameters.tuning_mode = advanced.adaboost.hyperparameterMode;
    if (advanced.adaboost.hyperparameterMode === "grid_search") {
      hyperparameters.grid_search = advanced.adaboost.gridSearchParams;
    }
  }

  return {
    model: options.model,
    test_size: options.test_size,
    random_state: options.random_state,
    cv_folds: options.cv_folds,
    scale_features: advanced.features.scaleFeatures,
    scaler_type: advanced.features.scalerType,
    probability_threshold: threshold,
    preprocessing: {
      missing_values: advanced.preprocessing.missingValues,
      column_types: advanced.preprocessing.columnTypes,
    },
    training: {
      validation_strategy: advanced.training.validationStrategy,
      imbalance_handling: advanced.training.imbalanceHandling,
    },
    features: {
      auto_remove_low_importance: advanced.features.autoRemoveLowImportance,
    },
    hyperparameters,
  };
}

export function mergeOptionsWithAdvanced(
  options: ClassificationOptions,
  advanced: ClassificationAdvancedState,
): ClassificationOptions {
  return {
    ...options,
    scale_features: advanced.features.scaleFeatures,
  };
}

export function resetAdvancedForModel(
  modelId: ClassificationModelId,
  prev: ClassificationAdvancedState,
): ClassificationAdvancedState {
  const modelDefaults = getDefaultClassificationOptions();
  return {
    ...prev,
    features: {
      ...prev.features,
      scaleFeatures:
        modelId === "logistic_regression" || modelId === "knn" || modelId === "svc",
    },
    adaboost: {
      ...getDefaultAdvancedState().adaboost,
    },
  };
}

export { getDefaultClassificationOptions, getDefaultHyperparameters };
