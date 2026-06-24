"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import { CHART_COLORS } from "@/data/chartData";

type QQPoint = { theoretical: number; sample: number };

type QQPlotChartProps = {
  data?: QQPoint[];
};

export default function QQPlotChart({ data }: QQPlotChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const minVal = Math.min(
    ...data.map((point) => Math.min(point.theoretical, point.sample)),
  );
  const maxVal = Math.max(
    ...data.map((point) => Math.max(point.theoretical, point.sample)),
  );

  return (
    <ChartCard
      title="Q-Q Plot"
      description="Sample quantiles vs theoretical normal quantiles"
    >
      <ResponsiveContainer width="100%" height={288} minWidth={0}>
        <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            dataKey="theoretical"
            name="Theoretical"
            tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="sample"
            name="Sample"
            tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis range={[48, 48]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          />
          <Scatter data={data} fill={CHART_COLORS.primary} />
          <ReferenceLine
            segment={[
              { x: minVal, y: minVal },
              { x: maxVal, y: maxVal },
            ]}
            stroke={CHART_COLORS.muted}
            strokeDasharray="4 4"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
