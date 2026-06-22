"use client";

import FrequencyChart from "@/components/charts/FrequencyChart";
import GroupMeansChart from "@/components/charts/GroupMeansChart";
import HistogramChart from "@/components/charts/HistogramChart";
import ROCChart from "@/components/charts/ROCChart";
import ConfusionMatrixChart from "@/components/charts/ConfusionMatrixChart";
import ScatterRegressionChart from "@/components/charts/ScatterRegressionChart";

type HistogramBin = { bin: string; count: number };
type GroupMean = { group: string; mean: number; sd: number };
type Point = { x: number; y: number };
type FrequencyItem = { label: string; count: number };
type RocPoint = { fpr: number; tpr: number };
type ConfusionMatrixData = { labels: string[]; matrix: number[][] };

type ResultsChartsProps = {
  chartData: Record<string, unknown>;
  showRegression?: boolean;
};

function asArray<T>(value: unknown): T[] | undefined {
  return Array.isArray(value) ? (value as T[]) : undefined;
}

function extractHistogram(chartData: Record<string, unknown>): HistogramBin[] | undefined {
  const raw = chartData.histogram;
  if (Array.isArray(raw)) return raw as HistogramBin[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { histogram?: unknown }).histogram)) {
    return (raw as { histogram: HistogramBin[] }).histogram;
  }
  return undefined;
}

export default function ResultsCharts({
  chartData,
  showRegression = false,
}: ResultsChartsProps) {
  const groupMeans = asArray<GroupMean>(chartData.group_means);
  const histogram = extractHistogram(chartData);
  const frequency = asArray<FrequencyItem>(chartData.frequency);
  const scatter = asArray<Point>(chartData.scatter);
  const regressionLine = asArray<Point>(chartData.regression_line);
  const roc = asArray<RocPoint>(chartData.roc);
  const confusionRaw = chartData.confusion_matrix as ConfusionMatrixData | undefined;
  const confusionMatrix =
    confusionRaw &&
    Array.isArray(confusionRaw.labels) &&
    Array.isArray(confusionRaw.matrix)
      ? confusionRaw
      : undefined;

  const hasCharts = Boolean(
    groupMeans?.length ||
      histogram?.length ||
      frequency?.length ||
      scatter?.length ||
      roc?.length ||
      confusionMatrix,
  );

  if (!hasCharts) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groupMeans && groupMeans.length > 0 && <GroupMeansChart data={groupMeans} />}
      {histogram && histogram.length > 0 && <HistogramChart data={histogram} />}
      {frequency && frequency.length > 0 && <FrequencyChart data={frequency} />}
      {scatter && scatter.length > 0 && (
        <ScatterRegressionChart
          title={showRegression ? "Regression Plot" : "Scatter Plot"}
          description={
            showRegression
              ? "Relationship with fitted regression line"
              : "Relationship between variables"
          }
          showRegressionLine={showRegression || Boolean(regressionLine?.length)}
          points={scatter}
          regressionLine={regressionLine}
        />
      )}
      {roc && roc.length > 0 && <ROCChart data={roc} />}
      {confusionMatrix && (
        <ConfusionMatrixChart
          labels={confusionMatrix.labels}
          matrix={confusionMatrix.matrix}
        />
      )}
    </div>
  );
}
