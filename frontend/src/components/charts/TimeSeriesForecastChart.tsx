"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";

type TimeSeriesPoint = {
  date: string;
  actual: number | null;
  predicted: number | null;
};

type TimeSeriesForecastChartProps = {
  dates: string[];
  actual: number[];
  predicted: Array<number | null>;
  trainSize: number;
};

export default function TimeSeriesForecastChart({
  dates,
  actual,
  predicted,
  trainSize,
}: TimeSeriesForecastChartProps) {
  const data: TimeSeriesPoint[] = dates.map((date, index) => ({
    date,
    actual: actual[index] ?? null,
    predicted: predicted[index] ?? null,
  }));

  return (
    <ChartCard
      title="Forecast vs actual"
      description={`Solid line = observed series. Dashed = model predictions on the last ${dates.length - trainSize} hold-out points.`}
    >
      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              minTickGap={24}
              className="text-muted"
            />
            <YAxis tick={{ fontSize: 11 }} className="text-muted" />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#2563eb"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={2}
              strokeDasharray="6 4"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
