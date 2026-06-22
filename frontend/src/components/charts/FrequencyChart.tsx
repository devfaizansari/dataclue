"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import { CHART_COLORS } from "@/data/chartData";

type FrequencyItem = { label: string; count: number };

type FrequencyChartProps = {
  data: FrequencyItem[];
  title?: string;
};

const barColors = ["#2563eb", "#3b82f6", "#60a5fa", "#22c55e", "#f59e0b", "#ef4444"];

export default function FrequencyChart({
  data,
  title = "Frequency Distribution",
}: FrequencyChartProps) {
  if (!data.length) return null;

  return (
    <ChartCard title={title} description="Count per category">
      <ResponsiveContainer width="100%" height={288} minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((_, index) => (
              <Cell key={index} fill={barColors[index % barColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
