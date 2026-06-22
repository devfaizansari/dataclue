"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import { CHART_COLORS } from "@/data/chartData";

type RocPoint = { fpr: number; tpr: number };

type ROCChartProps = {
  data: RocPoint[];
};

export default function ROCChart({ data }: ROCChartProps) {
  if (!data.length) return null;

  return (
    <ChartCard title="ROC Curve" description="True positive rate vs false positive rate">
      <ResponsiveContainer width="100%" height={288} minWidth={0}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
            label={{ value: "FPR", position: "insideBottom", offset: -2, fontSize: 11 }}
          />
          <YAxis
            dataKey="tpr"
            type="number"
            domain={[0, 1]}
            tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
            label={{ value: "TPR", angle: -90, position: "insideLeft", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
            formatter={(value, name) => [
              typeof value === "number" ? value.toFixed(3) : value,
              name === "tpr" ? "TPR" : "FPR",
            ]}
          />
          <Line
            type="monotone"
            dataKey="tpr"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
