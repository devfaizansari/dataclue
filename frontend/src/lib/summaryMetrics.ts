export type SummaryMetricId =
  | "n"
  | "mean"
  | "median"
  | "mode"
  | "sum"
  | "std"
  | "variance"
  | "sem"
  | "cv"
  | "min"
  | "max"
  | "range"
  | "q1"
  | "q3"
  | "iqr"
  | "p10"
  | "p90"
  | "p95"
  | "p99"
  | "skewness"
  | "kurtosis";

export type SummaryMetricSelection = SummaryMetricId | `p${number}`;

export type ConfidenceLevel = 90 | 95 | 99;

export type SummaryOptions = {
  selectedMetrics: SummaryMetricSelection[];
  customPercentiles: number[];
  confidenceInterval: {
    enabled: boolean;
    level: ConfidenceLevel;
  };
};

export type SummaryMetricOption = {
  id: SummaryMetricSelection;
  label: string;
};

export const SUMMARY_METRIC_OPTIONS: SummaryMetricOption[] = [
  { id: "n", label: "N (Count)" },
  { id: "mean", label: "Mean" },
  { id: "median", label: "Median" },
  { id: "mode", label: "Mode" },
  { id: "sum", label: "Sum" },
  { id: "std", label: "Std. Deviation" },
  { id: "variance", label: "Variance" },
  { id: "sem", label: "Std. Error (SEM)" },
  { id: "cv", label: "Coefficient of Variation" },
  { id: "min", label: "Minimum" },
  { id: "max", label: "Maximum" },
  { id: "range", label: "Range" },
  { id: "q1", label: "Q1 (25th Percentile)" },
  { id: "q3", label: "Q3 (75th Percentile)" },
  { id: "iqr", label: "IQR" },
  { id: "p10", label: "10th Percentile" },
  { id: "p90", label: "90th Percentile" },
  { id: "p95", label: "95th Percentile" },
  { id: "p99", label: "99th Percentile" },
  { id: "skewness", label: "Skewness" },
  { id: "kurtosis", label: "Kurtosis" },
];

export const METRIC_GROUPS: { title: string; metrics: SummaryMetricId[] }[] = [
  {
    title: "Overview",
    metrics: ["n", "sum"],
  },
  {
    title: "Central Tendency",
    metrics: ["mean", "median", "mode"],
  },
  {
    title: "Dispersion",
    metrics: ["std", "variance", "sem", "cv", "min", "max", "range", "iqr"],
  },
  {
    title: "Percentiles",
    metrics: ["q1", "q3", "p10", "p90", "p95", "p99"],
  },
  {
    title: "Distribution",
    metrics: ["skewness", "kurtosis"],
  },
];

export const DEFAULT_SUMMARY_METRICS: SummaryMetricSelection[] = [
  "mean",
  "std",
  "min",
  "max",
];

export const ALL_SUMMARY_METRICS: SummaryMetricSelection[] = SUMMARY_METRIC_OPTIONS.map(
  (metric) => metric.id,
);

export function getDefaultSummaryOptions(): SummaryOptions {
  return {
    selectedMetrics: [...DEFAULT_SUMMARY_METRICS],
    customPercentiles: [],
    confidenceInterval: {
      enabled: false,
      level: 95,
    },
  };
}

export function customPercentileId(value: number): `p${number}` {
  return `p${value}`;
}

export function customPercentileLabel(value: number): string {
  const suffix =
    value % 10 === 1 && value !== 11
      ? "st"
      : value % 10 === 2 && value !== 12
        ? "nd"
        : value % 10 === 3 && value !== 13
          ? "rd"
          : "th";
  return `${value}${suffix} Percentile`;
}

export function isCustomPercentileMetric(id: SummaryMetricSelection): boolean {
  if (typeof id !== "string" || !/^p\d+$/.test(id)) return false;
  return !SUMMARY_METRIC_OPTIONS.some((metric) => metric.id === id);
}

export function summaryOptionsToPayload(
  options: SummaryOptions,
  groupBy?: string,
) {
  const requested = [...options.selectedMetrics];
  for (const value of options.customPercentiles) {
    const id = customPercentileId(value);
    if (!requested.includes(id)) {
      requested.push(id);
    }
  }

  return {
    requested_metrics: requested,
    group_column: groupBy || undefined,
    confidence_interval: {
      enabled: options.confidenceInterval.enabled,
      level: options.confidenceInterval.level,
    },
  };
}

export function validateSummaryOptions(options: SummaryOptions): string | null {
  if (options.selectedMetrics.length === 0) {
    return "Select at least one metric to calculate.";
  }
  return null;
}

export const DEFAULT_PERCENTILE_METRICS: SummaryMetricSelection[] = [
  "p10",
  "q1",
  "q3",
  "p90",
  "p95",
  "p99",
];

export function percentileOptionsToPayload(
  selected: SummaryMetricSelection[],
  customPercentiles: number[],
) {
  const ranks = new Set<number>();

  for (const metric of selected) {
    if (metric === "q1") ranks.add(25);
    else if (metric === "q3") ranks.add(75);
    else if (metric === "median") ranks.add(50);
    else if (/^p\d+$/.test(metric)) ranks.add(Number(String(metric).slice(1)));
  }

  for (const value of customPercentiles) {
    ranks.add(value);
  }

  return {
    requested_percentiles: [...ranks].sort((a, b) => a - b),
  };
}

export function validatePercentileOptions(
  selected: SummaryMetricSelection[],
  customPercentiles: number[],
): string | null {
  if (selected.length === 0 && customPercentiles.length === 0) {
    return "Select at least one percentile to calculate.";
  }
  return null;
}

/** @deprecated Use validateSummaryOptions */
export function validateSummaryMetrics(metrics: SummaryMetricSelection[]): string | null {
  if (metrics.length === 0) {
    return "Select at least one metric to calculate.";
  }
  return null;
}

export function getMetricLabel(id: SummaryMetricSelection): string {
  const known = SUMMARY_METRIC_OPTIONS.find((metric) => metric.id === id);
  if (known) return known.label;
  if (isCustomPercentileMetric(id)) {
    return customPercentileLabel(Number(String(id).slice(1)));
  }
  return String(id);
}
