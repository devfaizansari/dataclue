export type FeatureTransformMethod =
  | "standard"
  | "minmax"
  | "robust"
  | "maxabs"
  | "quantile"
  | "power"
  | "log"
  | "log1p"
  | "sqrt";

export const FEATURE_TRANSFORM_OPTIONS: {
  value: FeatureTransformMethod;
  label: string;
  group: "scaling" | "transform";
}[] = [
  { value: "standard", label: "StandardScaler", group: "scaling" },
  { value: "minmax", label: "MinMaxScaler", group: "scaling" },
  { value: "robust", label: "RobustScaler", group: "scaling" },
  { value: "maxabs", label: "MaxAbsScaler", group: "scaling" },
  { value: "quantile", label: "QuantileTransformer", group: "scaling" },
  { value: "power", label: "PowerTransformer (Yeo-Johnson)", group: "scaling" },
  { value: "log", label: "Log transform", group: "transform" },
  { value: "log1p", label: "Log1p transform", group: "transform" },
  { value: "sqrt", label: "Square-root transform", group: "transform" },
];

export const NORMALIZATION_OPTIONS = FEATURE_TRANSFORM_OPTIONS.filter((option) =>
  ["quantile", "power", "log", "log1p", "sqrt"].includes(option.value),
);

export const ML_SCALER_OPTIONS = FEATURE_TRANSFORM_OPTIONS.filter(
  (option) => option.group === "scaling",
);

export function getDefaultFeatureTransformMethod(): FeatureTransformMethod {
  return "standard";
}

export function getDefaultNormalizationMethod(): FeatureTransformMethod {
  return "quantile";
}
