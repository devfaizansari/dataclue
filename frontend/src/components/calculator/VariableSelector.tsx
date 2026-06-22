"use client";

import type { DataVariable } from "@/lib/testVariableConfig";
import {
  buildDefaultSelections,
  getVariableFieldsForTest,
} from "@/lib/testVariableConfig";

type VariableSelectorProps = {
  testId: string;
  variables: DataVariable[];
  selections: Record<string, string | string[]>;
  onChange: (selections: Record<string, string | string[]>) => void;
};

export default function VariableSelector({
  testId,
  variables,
  selections,
  onChange,
}: VariableSelectorProps) {
  const fields = getVariableFieldsForTest(testId);
  const numericVars = variables.filter((v) => v.type === "numeric");
  const categoricalVars = variables.filter((v) => v.type === "categorical");

  if (variables.length === 0) return null;

  const handleSingleChange = (key: string, value: string) => {
    onChange({ ...selections, [key]: value });
  };

  const handleMultiToggle = (key: string, name: string) => {
    const current = Array.isArray(selections[key]) ? (selections[key] as string[]) : [];
    const next = current.includes(name)
      ? current.filter((v) => v !== name)
      : [...current, name];
    onChange({ ...selections, [key]: next });
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-foreground">Select Variables</h2>
        <p className="mt-1 text-xs text-muted">
          Variables are your data columns. Choose which ones to use for this test.
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        {fields.map((field) => {
          if (field.type === "numeric[]") {
            const exclude = new Set<string>();
            if (typeof selections.y_column === "string") {
              exclude.add(selections.y_column);
            }
            if (typeof selections.outcome_column === "string") {
              exclude.add(selections.outcome_column);
            }
            if (field.key === "value_columns" && typeof selections.group_column === "string") {
              exclude.add(selections.group_column);
            }
            const pool = numericVars.filter((v) => !exclude.has(v.name));
            const selected = Array.isArray(selections[field.key])
              ? (selections[field.key] as string[])
              : [];
            return (
              <div key={field.key} className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <p className="mb-2 text-xs text-muted">
                  Click to select or deselect. Choose one or more variables to include in the analysis.
                </p>
                <div className="flex flex-wrap gap-2">
                  {pool.map((variable) => {
                    const active = selected.includes(variable.name);
                    return (
                      <button
                        key={variable.name}
                        type="button"
                        onClick={() => handleMultiToggle(field.key, variable.name)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface-muted text-foreground hover:bg-surface"
                        }`}
                      >
                        {variable.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          const pool =
            field.key === "group_column"
              ? variables.filter(
                  (v) =>
                    v.group_eligible ??
                    (v.type === "categorical" && (v.unique_count ?? 2) >= 2),
                )
              : field.type === "numeric"
                ? numericVars
                : field.type === "categorical"
                  ? categoricalVars
                  : variables;
          const value = (selections[field.key] as string) ?? "";
          const selectedVar = variables.find((v) => v.name === value);

          return (
            <div key={field.key}>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {field.label}
              </label>
              <select
                value={value}
                onChange={(e) => handleSingleChange(field.key, e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select variable…</option>
                {pool.map((variable) => (
                  <option key={variable.name} value={variable.name}>
                    {variable.name} ({variable.type}
                    {variable.unique_count !== undefined ? `, ${variable.unique_count} unique` : ""}
                    )
                  </option>
                ))}
              </select>
              {field.key === "group_column" && selectedVar && (selectedVar.unique_count ?? 0) < 2 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  This column has only one category. Choose a column with at least 2 groups.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-5 py-3 sm:px-6">
        <p className="text-xs text-muted">
          Detected: {numericVars.length} numeric, {categoricalVars.length} categorical
          {variables.length > 0 && (
            <button
              type="button"
              className="ml-2 font-medium text-primary hover:underline"
              onClick={() => onChange(buildDefaultSelections(testId, variables))}
            >
              Reset to auto
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
