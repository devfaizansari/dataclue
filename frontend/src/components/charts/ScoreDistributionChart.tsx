"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import { CHART_COLORS, tTestScoreDistribution } from "@/data/chartData";

export default function ScoreDistributionChart() {
  return (
    <ChartCard
      title="Score Distribution by Group"
      description="Frequency of scores across score ranges"
    >
      <ResponsiveContainer width="100%" height={288} minWidth={0}>
        <BarChart
          data={tTestScoreDistribution}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="range"
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
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="groupA"
            name="Group A"
            fill={CHART_COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="groupB"
            name="Group B"
            fill={CHART_COLORS.secondary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
