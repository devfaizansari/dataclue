"use client";

import {
  FEATURE_TRANSFORM_OPTIONS,
  NORMALIZATION_OPTIONS,
  type FeatureTransformMethod,
} from "@/lib/featureTransform";

type FeatureTransformSelectorProps = {
  value: FeatureTransformMethod;
  onChange: (value: FeatureTransformMethod) => void;
  purpose?: "scaling" | "normalization";
};

export default function FeatureTransformSelector({
  value,
  onChange,
  purpose = "scaling",
}: FeatureTransformSelectorProps) {
  const isNormalization = purpose === "normalization";
  const options = isNormalization ? NORMALIZATION_OPTIONS : FEATURE_TRANSFORM_OPTIONS;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-foreground">
          {isNormalization ? "Normalize Data" : "Scaling & Transformation"}
        </h2>
        <p className="mt-1 text-xs text-muted">
          {isNormalization
            ? "Choose how to transform skewed or non-normal data. Quantile transform is recommended for normality."
            : "Choose how numeric variables should be scaled or transformed before download."}
        </p>
      </div>
      <div className="p-5 sm:p-6">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {isNormalization ? "Normalization method" : "Method"}
        </label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as FeatureTransformMethod)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">
          {isNormalization
            ? "After running analysis, download the normalized dataset as CSV or Excel from the results section."
            : "Log and square-root transforms require valid value ranges. Power and quantile transforms work on any numeric data."}
        </p>
      </div>
    </div>
  );
}
