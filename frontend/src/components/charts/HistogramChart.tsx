"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import { CHART_COLORS, histogramData } from "@/data/chartData";

type HistogramBin = { bin: string; count: number };

type HistogramChartProps = {
  data?: HistogramBin[];
};

export default function HistogramChart({ data }: HistogramChartProps) {
  const chartData = Array.isArray(data) ? data : histogramData;

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return null;
  }

  return (
    <ChartCard
      title="Histogram"
      description="Distribution of values across bins"
    >
      <ResponsiveContainer width="100%" height={288} minWidth={0}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          />
          <Bar
            dataKey="count"
            fill={CHART_COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
