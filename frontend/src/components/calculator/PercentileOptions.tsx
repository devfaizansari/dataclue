"use client";

import { useState } from "react";
import {
  customPercentileId,
  customPercentileLabel,
  type SummaryMetricSelection,
} from "@/lib/summaryMetrics";

type PercentileOptionsProps = {
  selected: SummaryMetricSelection[];
  customPercentiles: number[];
  onChange: (selected: SummaryMetricSelection[], customPercentiles: number[]) => void;
};

const checkboxClassName =
  "h-4 w-4 rounded border-border text-primary focus:ring-primary/30";

const metricCardClass = (checked: boolean) =>
  `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
    checked
      ? "border-primary/40 bg-primary-light/50 text-foreground dark:bg-primary/10"
      : "border-border bg-surface-muted/40 text-muted hover:border-primary/20 hover:bg-surface-muted"
  }`;

const STANDARD_PERCENTILES: { id: SummaryMetricSelection; label: string }[] = [
  { id: "p10", label: "10th Percentile" },
  { id: "p90", label: "90th Percentile" },
  { id: "p95", label: "95th Percentile" },
  { id: "p99", label: "99th Percentile" },
  { id: "q1", label: "Q1 (25th Percentile)" },
  { id: "q3", label: "Q3 (75th Percentile)" },
];

export default function PercentileOptions({
  selected,
  customPercentiles,
  onChange,
}: PercentileOptionsProps) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (id: SummaryMetricSelection) => {
    if (selected.includes(id)) {
      onChange(
        selected.filter((metric) => metric !== id),
        customPercentiles,
      );
      return;
    }
    onChange([...selected, id], customPercentiles);
  };

  const addCustomPercentile = () => {
    const value = Number(customInput);
    if (!Number.isInteger(value) || value < 1 || value > 99) return;
    if (customPercentiles.includes(value)) {
      setCustomInput("");
      return;
    }
    const id = customPercentileId(value);
    onChange(
      selected.includes(id) ? selected : [...selected, id],
      [...customPercentiles, value].sort((a, b) => a - b),
    );
    setCustomInput("");
  };

  const removeCustomPercentile = (value: number) => {
    const id = customPercentileId(value);
    onChange(
      selected.filter((metric) => metric !== id),
      customPercentiles.filter((item) => item !== value),
    );
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-foreground">Percentile Options</h2>
        <p className="mt-1 text-xs text-muted">
          Choose standard or custom percentile cutoffs for this analysis.
        </p>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STANDARD_PERCENTILES.map((item) => (
            <label key={item.id} className={metricCardClass(selected.includes(item.id))}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
                className={checkboxClassName}
              />
              <span className="font-medium">{item.label}</span>
            </label>
          ))}
          {customPercentiles.map((value) => {
            const id = customPercentileId(value);
            return (
              <div key={id} className="relative">
                <label className={metricCardClass(selected.includes(id))}>
                  <input
                    type="checkbox"
                    checked={selected.includes(id)}
                    onChange={() => toggle(id)}
                    className={checkboxClassName}
                  />
                  <span className="font-medium">{customPercentileLabel(value)}</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeCustomPercentile(value)}
                  className="absolute top-2 right-2 rounded px-1 text-[10px] font-medium text-muted hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
      </div>
    </div>
  );
}
