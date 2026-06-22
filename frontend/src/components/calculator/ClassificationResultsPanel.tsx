"use client";

import { useMemo, useState } from "react";
import ConfusionMatrixChart from "@/components/charts/ConfusionMatrixChart";
import ResultsCharts from "./ResultsCharts";
import StatResultItem from "./StatResultItem";
import type { AnalysisResponse } from "@/lib/api";
import type { RunHistoryEntry } from "@/lib/classificationAdvanced";

type ClassificationResultsPanelProps = {
  result: AnalysisResponse;
};

type ThresholdData = {
  y_true: number[];
  y_proba: number[];
  labels: string[];
};

function buildConfusionMatrix(yTrue: number[], yPred: number[], classCount: number) {
  const matrix = Array.from({ length: classCount }, () => Array(classCount).fill(0));
  for (let i = 0; i < yTrue.length; i += 1) {
    matrix[yTrue[i]][yPred[i]] += 1;
  }
  return matrix;
}

function metricsFromThreshold(data: ThresholdData, threshold: number) {
  const yPred = data.y_proba.map((proba) => (proba >= threshold ? 1 : 0));
  const tp = data.y_true.filter((label, index) => label === 1 && yPred[index] === 1).length;
  const fp = data.y_true.filter((label, index) => label === 0 && yPred[index] === 1).length;
  const fn = data.y_true.filter((label, index) => label === 1 && yPred[index] === 0).length;
  const tn = data.y_true.filter((label, index) => label === 0 && yPred[index] === 0).length;

  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = data.y_true.length === 0 ? 0 : (tp + tn) / data.y_true.length;

  return {
    accuracy,
    precision,
    recall,
    f1,
    matrix: buildConfusionMatrix(data.y_true, yPred, data.labels.length),
  };
}

export default function ClassificationResultsPanel({ result }: ClassificationResultsPanelProps) {
  const thresholdData = (result.chart_data?.threshold_data ?? null) as ThresholdData | null;
  const [threshold, setThreshold] = useState(
    Number(result.chart_data?.probability_threshold ?? 0.5),
  );
  const [history, setHistory] = useState<RunHistoryEntry[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const adjusted = useMemo(() => {
    if (!thresholdData || thresholdData.labels.length !== 2) return null;
    return metricsFromThreshold(thresholdData, threshold);
  }, [thresholdData, threshold]);

  const displayStats = useMemo(() => {
    const base = result.stats.map((stat) => ({
      label: stat.label,
      value: stat.value,
      badge: stat.badge
        ? {
            text: stat.badge.text,
            variant: stat.badge.variant as "success" | "warning" | "info",
          }
        : undefined,
    }));

    if (!adjusted) return base;

    return base.map((stat) => {
      if (stat.label === "Accuracy") return { ...stat, value: adjusted.accuracy.toFixed(4) };
      if (stat.label === "Precision") return { ...stat, value: adjusted.precision.toFixed(4) };
      if (stat.label === "Recall") return { ...stat, value: adjusted.recall.toFixed(4) };
      if (stat.label === "F1 Score") return { ...stat, value: adjusted.f1.toFixed(4) };
      return stat;
    });
  }, [result.stats, adjusted]);

  const chartData = useMemo(() => {
    const next = { ...(result.chart_data ?? {}) };
    if (adjusted && thresholdData) {
      next.confusion_matrix = {
        labels: thresholdData.labels,
        matrix: adjusted.matrix,
      };
    }
    return next;
  }, [result.chart_data, adjusted, thresholdData]);

  const addToHistory = () => {
    const accuracy = Number(displayStats.find((stat) => stat.label === "Accuracy")?.value ?? 0);
    const precision = Number(displayStats.find((stat) => stat.label === "Precision")?.value ?? 0);
    const recall = Number(displayStats.find((stat) => stat.label === "Recall")?.value ?? 0);
    const f1 = Number(displayStats.find((stat) => stat.label === "F1 Score")?.value ?? 0);
    const model = displayStats.find((stat) => stat.label === "Model")?.value ?? result.title;

    setHistory((prev) => [
      {
        id: `run-${prev.length + 1}`,
        model,
        accuracy,
        precision,
        recall,
        f1,
        threshold,
        timestamp: new Date().toLocaleString(),
        stats: displayStats,
        interpretation: result.interpretation,
        chartData,
        title: result.title,
      },
      ...prev,
    ].slice(0, 10));
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparedRuns = history.filter((entry) => compareIds.includes(entry.id));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-foreground">Results — {result.title}</h2>
            <button
              type="button"
              onClick={addToHistory}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-muted"
            >
              Save to history
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {thresholdData && thresholdData.labels.length === 2 && (
            <div className="rounded-lg border border-border bg-surface-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-foreground">
                  Probability threshold: {threshold.toFixed(2)}
                </label>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="mt-2 text-xs text-muted">
                Adjusting threshold recalculates Precision, Recall, and Confusion Matrix dynamically.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {displayStats.map((stat) => (
              <StatResultItem key={stat.label} {...stat} />
            ))}
          </div>

          <ResultsCharts chartData={chartData} />

          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/40">
            <h3 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
              Interpretation
            </h3>
            <p className="text-sm leading-relaxed text-green-900 dark:text-green-100">
              {result.interpretation}
            </p>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-foreground">History Log</h2>
            <p className="mt-1 text-xs text-muted">
              Select up to two runs to compare side-by-side.
            </p>
          </div>
          <div className="overflow-x-auto p-5 sm:p-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Compare</th>
                  <th className="px-3 py-2">Run ID</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Accuracy</th>
                  <th className="px-3 py-2">Precision</th>
                  <th className="px-3 py-2">Recall</th>
                  <th className="px-3 py-2">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/70">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(entry.id)}
                        onChange={() => toggleCompare(entry.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                    </td>
                    <td className="px-3 py-2 text-foreground">{entry.id}</td>
                    <td className="px-3 py-2 text-foreground">{entry.model}</td>
                    <td className="px-3 py-2 text-foreground">{entry.accuracy.toFixed(4)}</td>
                    <td className="px-3 py-2 text-foreground">{entry.precision.toFixed(4)}</td>
                    <td className="px-3 py-2 text-foreground">{entry.recall.toFixed(4)}</td>
                    <td className="px-3 py-2 text-foreground">{entry.threshold.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {comparedRuns.length === 2 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {comparedRuns.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {entry.id} — {entry.model}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {entry.stats.slice(0, 6).map((stat) => (
                  <StatResultItem key={`${entry.id}-${stat.label}`} {...stat} />
                ))}
              </div>
              {Boolean(entry.chartData.confusion_matrix) && (
                <div className="mt-4">
                  <ConfusionMatrixChart
                    labels={
                      (entry.chartData.confusion_matrix as { labels: string[] }).labels
                    }
                    matrix={
                      (entry.chartData.confusion_matrix as { matrix: number[][] }).matrix
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
