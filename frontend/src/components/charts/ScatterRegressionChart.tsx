"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import { CHART_COLORS, scatterRegressionData } from "@/data/chartData";

type Point = { x: number; y: number };

type ScatterRegressionChartProps = {
  title: string;
  description: string;
  showRegressionLine?: boolean;
  points?: Point[];
  regressionLine?: Point[];
};

export default function ScatterRegressionChart({
  title,
  description,
  showRegressionLine = false,
  points = scatterRegressionData,
  regressionLine,
}: ScatterRegressionChartProps) {
  const xMin = Math.min(...points.map((p) => p.x)) - 2;
  const xMax = Math.max(...points.map((p) => p.x)) + 2;
  const yMin = Math.min(...points.map((p) => p.y)) - 5;
  const yMax = Math.max(...points.map((p) => p.y)) + 5;

  const line =
    regressionLine ??
    (showRegressionLine && points.length >= 2
      ? [
          { x: xMin, y: points[0].y },
          { x: xMax, y: points[points.length - 1].y },
        ]
      : undefined);

  return (
    <ChartCard title={title} description={description}>
      <ResponsiveContainer width="100%" height={288} minWidth={0}>
        <ComposedChart margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[xMin, xMax]}
            tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[yMin, yMax]}
            tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          />
          <Scatter name="Data points" data={points} fill={CHART_COLORS.primary} />
          {showRegressionLine && line && (
            <Line
              data={line}
              type="linear"
              dataKey="y"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={false}
              legendType="none"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
