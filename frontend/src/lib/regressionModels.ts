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

export type RegressionModelId =
  | "linear_regression"
  | "ridge"
  | "lasso"
  | "elastic_net"
  | "knn"
  | "svr"
  | "decision_tree"
  | "random_forest"
  | "xgboost"
  | "gradient_boosting";

export type RegressionModelDefinition = {
  id: RegressionModelId;
  label: string;
  description: string;
  defaultScaleFeatures: boolean;
  params: ModelParam[];
};

export type RegressionOptions = {
  model: RegressionModelId;
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
    help: "Standardize predictors before training. Recommended for linear models, SVM, and KNN.",
  },
];

export const REGRESSION_MODELS: RegressionModelDefinition[] = [
  {
    id: "linear_regression",
    label: "Linear Regression",
    description: "Ordinary least squares baseline for continuous outcomes.",
    defaultScaleFeatures: true,
    params: [],
  },
  {
    id: "ridge",
    label: "Ridge Regression",
    description: "L2-regularized linear model; reduces overfitting.",
    defaultScaleFeatures: true,
    params: [
      { key: "alpha", label: "Alpha (regularization)", type: "number", default: 1, min: 0.001, max: 100, step: 0.1 },
    ],
  },
  {
    id: "lasso",
    label: "Lasso Regression",
    description: "L1-regularized linear model; can zero out weak predictors.",
    defaultScaleFeatures: true,
    params: [
      { key: "alpha", label: "Alpha (regularization)", type: "number", default: 1, min: 0.001, max: 100, step: 0.1 },
      { key: "max_iter", label: "Max iterations", type: "number", default: 2000, min: 500, max: 10000, step: 500 },
    ],
  },
  {
    id: "elastic_net",
    label: "Elastic Net",
    description: "Combines L1 and L2 penalties for correlated predictors.",
    defaultScaleFeatures: true,
    params: [
      { key: "alpha", label: "Alpha", type: "number", default: 1, min: 0.001, max: 100, step: 0.1 },
      { key: "l1_ratio", label: "L1 ratio", type: "number", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "max_iter", label: "Max iterations", type: "number", default: 2000, min: 500, max: 10000, step: 500 },
    ],
  },
  {
    id: "knn",
    label: "K-Nearest Neighbors",
    description: "Predicts using the average of nearest training points.",
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
    id: "svr",
    label: "Support Vector Regression",
    description: "Kernel-based regression for non-linear relationships.",
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
      { key: "epsilon", label: "Epsilon", type: "number", default: 0.1, min: 0.001, max: 1, step: 0.01 },
    ],
  },
  {
    id: "decision_tree",
    label: "Decision Tree",
    description: "Non-linear tree model; easy to interpret.",
    defaultScaleFeatures: false,
    params: [
      { key: "max_depth", label: "Max depth", type: "number", default: 0, min: 0, max: 50, step: 1, help: "0 = unlimited" },
      { key: "min_samples_split", label: "Min samples split", type: "number", default: 2, min: 2, max: 50, step: 1 },
    ],
  },
  {
    id: "random_forest",
    label: "Random Forest",
    description: "Ensemble of trees; strong default for tabular regression.",
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
];

export function getRegressionModel(id: RegressionModelId) {
  return REGRESSION_MODELS.find((model) => model.id === id) ?? REGRESSION_MODELS[0];
}

export function getDefaultHyperparameters(modelId: RegressionModelId) {
  const model = getRegressionModel(modelId);
  const hyperparameters: Record<string, number | string | boolean> = {};
  for (const param of model.params) {
    hyperparameters[param.key] = param.default;
  }
  return hyperparameters;
}

export function getDefaultRegressionOptions(): RegressionOptions {
  const model = REGRESSION_MODELS[0];
  return {
    model: model.id,
    test_size: 0.2,
    random_state: 42,
    cv_folds: 5,
    scale_features: model.defaultScaleFeatures,
    hyperparameters: getDefaultHyperparameters(model.id),
  };
}

export function validateRegressionOptions(options: RegressionOptions): string | null {
  if (options.test_size < 0 || options.test_size > 0.5) {
    return "Test split must be between 0 and 0.5.";
  }
  if (options.cv_folds < 2 || options.cv_folds > 10) {
    return "CV folds must be between 2 and 10.";
  }
  return null;
}
