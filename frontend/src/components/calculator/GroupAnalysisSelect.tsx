"use client";

import { useMemo } from "react";
import type { DataVariable } from "@/lib/api";

type GroupAnalysisSelectProps = {
  variables: DataVariable[];
  value: string;
  onChange: (value: string) => void;
};

export default function GroupAnalysisSelect({
  variables,
  value,
  onChange,
}: GroupAnalysisSelectProps) {
  const categoricalColumns = useMemo(
    () =>
      variables.filter(
        (variable) =>
          variable.type === "categorical" ||
          (variable.group_eligible ?? (variable.unique_count ?? 0) >= 2),
      ),
    [variables],
  );

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-foreground">Segment Analysis</h2>
        <p className="mt-1 text-xs text-muted">
          Optionally split results by a categorical column such as Group or Treatment.
        </p>
      </div>
      <div className="p-5 sm:p-6">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Group Analysis By (Optional)
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">No grouping (entire sample)</option>
          {categoricalColumns.map((variable) => (
            <option key={variable.name} value={variable.name}>
              {variable.name}
              {variable.unique_count !== undefined ? ` (${variable.unique_count} groups)` : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
