"use client";

import { useMemo } from "react";
import { buildDataPreview, type ColumnType } from "@/lib/csvPreview";
import type { PreprocessingSettings } from "@/lib/classificationAdvanced";

type DataPreprocessingCardProps = {
  csvData: string;
  settings: PreprocessingSettings;
  onChange: (settings: PreprocessingSettings) => void;
  showAdvancedControls?: boolean;
};

const selectClassName =
  "rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function DataPreprocessingCard({
  csvData,
  settings,
  onChange,
  showAdvancedControls = false,
}: DataPreprocessingCardProps) {
  const preview = useMemo(() => buildDataPreview(csvData), [csvData]);

  if (!preview) return null;

  const setColumnType = (name: string, type: ColumnType) => {
    onChange({
      ...settings,
      columnTypes: { ...settings.columnTypes, [name]: type },
    });
  };

  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-foreground">Data Preview</h2>
        <p className="mt-1 text-xs text-muted">
          First 5 rows of your dataset. Adjust column types before running analysis.
        </p>
      </div>

      <div className="min-w-0 space-y-4 p-5 sm:p-6">
        <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-border">
          <table className="border-collapse text-sm table-auto">
            <thead className="bg-surface-muted/60">
              <tr>
                {preview.columns.map((column, colIndex) => {
                  const currentType = settings.columnTypes[column.name] ?? column.type;
                  return (
                    <th
                      key={`header-${colIndex}-${column.name}`}
                      className="whitespace-nowrap border-b border-border px-3 py-2 text-left align-top"
                    >
                      <div className="font-medium text-foreground">{column.name}</div>
                      <select
                        value={currentType}
                        onChange={(e) =>
                          setColumnType(column.name, e.target.value as ColumnType)
                        }
                        className={`mt-1 ${selectClassName}`}
                      >
                        <option value="numeric">Numeric</option>
                        <option value="categorical">Categorical</option>
                      </select>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-surface-muted/20">
                  {preview.columns.map((column, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}-${column.name}`}
                      className="whitespace-nowrap border-b border-border px-3 py-2 text-foreground"
                    >
                      {row[colIndex] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAdvancedControls && (
          <div className="max-w-md">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Missing values handling
            </label>
            <select
              value={settings.missingValues}
              onChange={(e) =>
                onChange({
                  ...settings,
                  missingValues: e.target.value as PreprocessingSettings["missingValues"],
                })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="drop">Drop rows</option>
              <option value="impute_mean">Impute (Mean)</option>
              <option value="impute_median">Impute (Median)</option>
              <option value="none">No action</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
