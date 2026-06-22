"use client";

import { useState } from "react";
import {
  ALL_SUMMARY_METRICS,
  customPercentileId,
  customPercentileLabel,
  DEFAULT_SUMMARY_METRICS,
  getMetricLabel,
  METRIC_GROUPS,
  type SummaryMetricSelection,
  type SummaryOptions,
} from "@/lib/summaryMetrics";

type MetricsSelectorProps = {
  options: SummaryOptions;
  onChange: (options: SummaryOptions) => void;
};

const checkboxClassName =
  "h-4 w-4 rounded border-border text-primary focus:ring-primary/30";

const metricCardClass = (checked: boolean) =>
  `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
    checked
      ? "border-primary/40 bg-primary-light/50 text-foreground dark:bg-primary/10"
      : "border-border bg-surface-muted/40 text-muted hover:border-primary/20 hover:bg-surface-muted"
  }`;

function MetricCheckbox({
  id,
  label,
  checked,
  onToggle,
}: {
  id: SummaryMetricSelection;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className={metricCardClass(checked)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className={checkboxClassName}
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

export default function MetricsSelector({ options, onChange }: MetricsSelectorProps) {
  const [customInput, setCustomInput] = useState("");

  const update = (patch: Partial<SummaryOptions>) => {
    onChange({ ...options, ...patch });
  };

  const toggleMetric = (id: SummaryMetricSelection) => {
    const selected = options.selectedMetrics;
    if (selected.includes(id)) {
      update({ selectedMetrics: selected.filter((metric) => metric !== id) });
      return;
    }
    update({ selectedMetrics: [...selected, id] });
  };

  const addCustomPercentile = () => {
    const value = Number(customInput);
    if (!Number.isInteger(value) || value < 1 || value > 99) return;
    if (options.customPercentiles.includes(value)) {
      setCustomInput("");
      return;
    }

    const id = customPercentileId(value);
    update({
      customPercentiles: [...options.customPercentiles, value].sort((a, b) => a - b),
      selectedMetrics: options.selectedMetrics.includes(id)
        ? options.selectedMetrics
        : [...options.selectedMetrics, id],
    });
    setCustomInput("");
  };

  const removeCustomPercentile = (value: number) => {
    const id = customPercentileId(value);
    update({
      customPercentiles: options.customPercentiles.filter((item) => item !== value),
      selectedMetrics: options.selectedMetrics.filter((metric) => metric !== id),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-foreground">Summary Statistics Controls</h2>
        <p className="mt-1 text-xs text-muted">
          Choose metrics and configure confidence intervals for your selected variable(s).
        </p>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-muted/30 p-4 lg:col-span-2">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={options.confidenceInterval.enabled}
                onChange={(e) =>
                  update({
                    confidenceInterval: {
                      ...options.confidenceInterval,
                      enabled: e.target.checked,
                    },
                  })
                }
                className={`mt-0.5 ${checkboxClassName}`}
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Calculate Confidence Intervals for Mean
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Adds a CI range when Mean is selected.
                </span>
              </span>
            </label>
            <div className="mt-3">
              <select
                value={options.confidenceInterval.level}
                disabled={!options.confidenceInterval.enabled}
                onChange={(e) =>
                  update({
                    confidenceInterval: {
                      ...options.confidenceInterval,
                      level: Number(e.target.value) as SummaryOptions["confidenceInterval"]["level"],
                    },
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value={90}>90%</option>
                <option value={95}>95%</option>
                <option value={99}>99%</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Select Metrics to Calculate</h3>
            <p className="mt-1 text-xs text-muted">
              Metrics are grouped for faster scanning in enterprise workflows.
            </p>
          </div>

          <div className="space-y-5">
            {METRIC_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
                  {group.title}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.metrics.map((metricId) => (
                    <MetricCheckbox
                      key={metricId}
                      id={metricId}
                      label={getMetricLabel(metricId)}
                      checked={options.selectedMetrics.includes(metricId)}
                      onToggle={() => toggleMetric(metricId)}
                    />
                  ))}

                  {group.title === "Percentiles" &&
                    options.customPercentiles.map((value) => {
                      const id = customPercentileId(value);
                      return (
                        <div key={id} className="relative">
                          <MetricCheckbox
                            id={id}
                            label={customPercentileLabel(value)}
                            checked={options.selectedMetrics.includes(id)}
                            onToggle={() => toggleMetric(id)}
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomPercentile(value)}
                            className="absolute top-2 right-2 rounded px-1 text-[10px] font-medium text-muted hover:text-red-500"
                            aria-label={`Remove ${value}th percentile`}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                </div>

                {group.title === "Percentiles" && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Custom percentile (e.g. 83)"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={addCustomPercentile}
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-5 py-3 sm:px-6">
        <p className="text-xs text-muted">
          {options.selectedMetrics.length} metric{options.selectedMetrics.length === 1 ? "" : "s"}{" "}
          selected
          <button
            type="button"
            className="ml-2 font-medium text-primary hover:underline"
            onClick={() =>
              update({
                selectedMetrics: [...DEFAULT_SUMMARY_METRICS],
                customPercentiles: [],
              })
            }
          >
            Reset to default
          </button>
          <button
            type="button"
            className="ml-2 font-medium text-primary hover:underline"
            onClick={() =>
              update({
                selectedMetrics: [
                  ...ALL_SUMMARY_METRICS,
                  ...options.customPercentiles.map((value) => customPercentileId(value)),
                ],
              })
            }
          >
            Select all
          </button>
        </p>
      </div>
    </div>
  );
}
