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

export type ClassificationModelId =
  | "logistic_regression"
  | "knn"
  | "gaussian_nb"
  | "svc"
  | "decision_tree"
  | "random_forest"
  | "xgboost"
  | "gradient_boosting"
  | "adaboost";

export type ClassificationModelDefinition = {
  id: ClassificationModelId;
  label: string;
  description: string;
  defaultScaleFeatures: boolean;
  params: ModelParam[];
};

export type ClassificationOptions = {
  model: ClassificationModelId;
  test_size: number;
  random_state: number;
  cv_folds: number;
  scale_features: boolean;
  hyperparameters: Record<string, number | string | boolean>;
};

export const GENERAL_CONTROLS: ModelParam[] = [
  {
    key: "test_size",
    label: "Test split",
    type: "number",
    default: 0.2,
    min: 0,
    max: 0.5,
    step: 0.05,
    help: "0 = cross-validation only. 0.2 = 20% held out for testing.",
  },
  {
    key: "random_state",
    label: "Random seed",
    type: "number",
    default: 42,
    min: 0,
    max: 9999,
    step: 1,
    help: "Fixes train/test split and model randomness for reproducible results.",
  },
  {
    key: "cv_folds",
    label: "CV folds",
    type: "number",
    default: 5,
    min: 2,
    max: 10,
    step: 1,
    help: "Used when test split is 0 or the dataset is too small to split.",
  },
  {
    key: "scale_features",
    label: "Scale features",
    type: "boolean",
    default: true,
    help: "Standardize predictors before training. Recommended for SVM, KNN, and logistic regression.",
  },
];

export const CLASSIFICATION_MODELS: ClassificationModelDefinition[] = [
  {
    id: "logistic_regression",
    label: "Logistic Regression",
    description: "Fast linear baseline for binary or multi-class outcomes.",
    defaultScaleFeatures: true,
    params: [
      { key: "C", label: "C (regularization)", type: "number", default: 1, min: 0.01, max: 100, step: 0.1 },
      { key: "max_iter", label: "Max iterations", type: "number", default: 1000, min: 100, max: 5000, step: 100 },
      {
        key: "penalty",
        label: "Penalty",
        type: "select",
        default: "l2",
        options: [
          { value: "l2", label: "L2" },
          { value: "l1", label: "L1" },
        ],
      },
    ],
  },
  {
    id: "knn",
    label: "K-Nearest Neighbors",
    description: "Classifies based on the nearest training examples.",
    defaultScaleFeatures: true,
    params: [
      { key: "n_neighbors", label: "Neighbors (k)", type: "number", default: 5, min: 1, max: 50, step: 1 },
      {
        key: "weights",
        label: "Weights",
        type: "select",
        default: "uniform",
        options: [
          { value: "uniform", label: "Uniform" },
          { value: "distance", label: "Distance" },
        ],
      },
      {
        key: "metric",
        label: "Distance metric",
        type: "select",
        default: "minkowski",
        options: [
          { value: "minkowski", label: "Minkowski" },
          { value: "euclidean", label: "Euclidean" },
          { value: "manhattan", label: "Manhattan" },
        ],
      },
    ],
  },
  {
    id: "gaussian_nb",
    label: "Gaussian Naive Bayes",
    description: "Probabilistic classifier assuming feature independence.",
    defaultScaleFeatures: false,
    params: [
      {
        key: "var_smoothing",
        label: "Variance smoothing",
        type: "number",
        default: 1e-9,
        min: 1e-12,
        max: 1,
        step: 1e-9,
      },
    ],
  },
  {
    id: "svc",
    label: "Support Vector Classifier",
    description: "Strong for complex boundaries with kernel tricks.",
    defaultScaleFeatures: true,
    params: [
      { key: "C", label: "C", type: "number", default: 1, min: 0.01, max: 100, step: 0.1 },
      {
        key: "kernel",
        label: "Kernel",
        type: "select",
        default: "rbf",
        options: [
          { value: "rbf", label: "RBF" },
          { value: "linear", label: "Linear" },
          { value: "poly", label: "Polynomial" },
        ],
      },
      {
        key: "gamma",
        label: "Gamma",
        type: "select",
        default: "scale",
        options: [
          { value: "scale", label: "Scale" },
          { value: "auto", label: "Auto" },
        ],
      },
    ],
  },
  {
    id: "decision_tree",
    label: "Decision Tree",
    description: "Interpretable if/else rules; can overfit without limits.",
    defaultScaleFeatures: false,
    params: [
      { key: "max_depth", label: "Max depth", type: "number", default: 0, min: 0, max: 50, step: 1, help: "0 = unlimited" },
      { key: "min_samples_split", label: "Min samples split", type: "number", default: 2, min: 2, max: 50, step: 1 },
      {
        key: "criterion",
        label: "Criterion",
        type: "select",
        default: "gini",
        options: [
          { value: "gini", label: "Gini" },
          { value: "entropy", label: "Entropy" },
        ],
      },
    ],
  },
  {
    id: "random_forest",
    label: "Random Forest",
    description: "Ensemble of trees; strong general-purpose choice.",
    defaultScaleFeatures: false,
    params: [
      { key: "n_estimators", label: "Trees", type: "number", default: 100, min: 10, max: 500, step: 10 },
      { key: "max_depth", label: "Max depth", type: "number", default: 0, min: 0, max: 50, step: 1, help: "0 = unlimited" },
      { key: "min_samples_split", label: "Min samples split", type: "number", default: 2, min: 2, max: 50, step: 1 },
    ],
  },
  {
    id: "xgboost",
    label: "XGBoost",
    description: "Gradient boosted trees; often top performance on tabular data.",
    defaultScaleFeatures: false,
    params: [
      { key: "n_estimators", label: "Estimators", type: "number", default: 100, min: 10, max: 500, step: 10 },
      { key: "max_depth", label: "Max depth", type: "number", default: 6, min: 1, max: 20, step: 1 },
      { key: "learning_rate", label: "Learning rate", type: "number", default: 0.1, min: 0.01, max: 1, step: 0.01 },
      { key: "subsample", label: "Subsample", type: "number", default: 1, min: 0.1, max: 1, step: 0.05 },
    ],
  },
  {
    id: "gradient_boosting",
    label: "Gradient Boosting",
    description: "Sequential trees that correct previous errors.",
    defaultScaleFeatures: false,
    params: [
      { key: "n_estimators", label: "Estimators", type: "number", default: 100, min: 10, max: 500, step: 10 },
      { key: "max_depth", label: "Max depth", type: "number", default: 3, min: 1, max: 20, step: 1 },
      { key: "learning_rate", label: "Learning rate", type: "number", default: 0.1, min: 0.01, max: 1, step: 0.01 },
    ],
  },
  {
    id: "adaboost",
    label: "AdaBoost",
    description: "Boosts weak learners into a stronger combined model.",
    defaultScaleFeatures: false,
    params: [
      { key: "n_estimators", label: "Estimators", type: "number", default: 50, min: 10, max: 500, step: 10 },
      { key: "learning_rate", label: "Learning rate", type: "number", default: 1, min: 0.01, max: 5, step: 0.05 },
    ],
  },
];

export function getClassificationModel(id: ClassificationModelId) {
  return CLASSIFICATION_MODELS.find((model) => model.id === id) ?? CLASSIFICATION_MODELS[0];
}

export function getDefaultHyperparameters(modelId: ClassificationModelId) {
  const model = getClassificationModel(modelId);
  const hyperparameters: Record<string, number | string | boolean> = {};
  for (const param of model.params) {
    hyperparameters[param.key] = param.default;
  }
  return hyperparameters;
}

export function getDefaultClassificationOptions(): ClassificationOptions {
  const model = CLASSIFICATION_MODELS[0];
  return {
    model: model.id,
    test_size: 0.2,
    random_state: 42,
    cv_folds: 5,
    scale_features: model.defaultScaleFeatures,
    hyperparameters: getDefaultHyperparameters(model.id),
  };
}

export function classificationOptionsToPayload(options: ClassificationOptions) {
  const hyperparameters = { ...options.hyperparameters };
  if ("max_depth" in hyperparameters && Number(hyperparameters.max_depth) === 0) {
    hyperparameters.max_depth = "none";
  }

  return {
    model: options.model,
    test_size: options.test_size,
    random_state: options.random_state,
    cv_folds: options.cv_folds,
    scale_features: options.scale_features,
    hyperparameters,
  };
}

export function validateClassificationOptions(options: ClassificationOptions): string | null {
  if (options.test_size < 0 || options.test_size > 0.5) {
    return "Test split must be between 0 and 0.5.";
  }
  if (options.cv_folds < 2 || options.cv_folds > 10) {
    return "CV folds must be between 2 and 10.";
  }
  return null;
}
