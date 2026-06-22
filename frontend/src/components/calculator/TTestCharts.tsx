"use client";

import GroupMeansChart from "@/components/charts/GroupMeansChart";

type GroupMean = { group: string; mean: number; sd: number };

type TTestChartsProps = {
  groupMeans?: GroupMean[];
};

export default function TTestCharts({ groupMeans }: TTestChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GroupMeansChart data={groupMeans} />
    </div>
  );
}
