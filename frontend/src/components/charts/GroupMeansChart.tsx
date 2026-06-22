"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ErrorBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import { CHART_COLORS, tTestGroupMeans } from "@/data/chartData";

type GroupMean = { group: string; mean: number; sd: number };

type GroupMeansChartProps = {
  data?: GroupMean[];
};

export default function GroupMeansChart({ data = tTestGroupMeans }: GroupMeansChartProps) {
  const maxMean = Math.max(...data.map((d) => d.mean + d.sd), 100);

  return (
    <ChartCard
      title="Group Means Comparison"
      description="Mean scores with standard deviation error bars"
    >
      <ResponsiveContainer width="100%" height={288} minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="group"
            tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, Math.ceil(maxMean * 1.1)]}
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
            formatter={(value) => [
              typeof value === "number" ? value.toFixed(2) : value,
              "Mean",
            ]}
          />
          <Bar
            dataKey="mean"
            fill={CHART_COLORS.primary}
            radius={[6, 6, 0, 0]}
            maxBarSize={80}
          >
            <ErrorBar dataKey="sd" width={4} stroke={CHART_COLORS.accent} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
