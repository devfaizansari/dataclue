"use client";

import { type ReactNode, useState } from "react";
import StatResultItem from "./StatResultItem";
import {
  exportResults,
  type ExportFormat,
  type ExportableResults,
} from "@/lib/exportResults";
import {
  downloadDataset,
  type DownloadableDataset,
} from "@/lib/exportData";

type ResultStat = {
  label: string;
  value: string;
  badge?: {
    text: string;
    variant: "success" | "warning" | "info";
  };
};

type ResultsCardProps = {
  title: string;
  stats: ResultStat[];
  interpretation: string;
  apaOutput?: string;
  charts?: ReactNode;
  downloads?: DownloadableDataset[];
};

const exportOptions: { format: ExportFormat; label: string }[] = [
  { format: "pdf", label: "PDF" },
  { format: "csv", label: "CSV" },
  { format: "excel", label: "Excel" },
];

export default function ResultsCard({
  title,
  stats,
  interpretation,
  apaOutput,
  charts,
  downloads = [],
}: ResultsCardProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const exportData: ExportableResults = {
    title,
    stats,
    interpretation,
    apaOutput,
  };

  const handleExport = (format: ExportFormat) => {
    setExporting(format);
    try {
      exportResults(exportData, format);
    } finally {
      setExporting(null);
    }
  };

  const handleDataDownload = (dataset: DownloadableDataset, asExcel: boolean) => {
    const key = `${dataset.filename}-${asExcel ? "excel" : "csv"}`;
    setDownloadingKey(key);
    try {
      downloadDataset(dataset, asExcel);
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-base font-semibold text-foreground">
          Results — {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {exportOptions.map(({ format, label }) => (
            <button
              key={format}
              type="button"
              onClick={() => handleExport(format)}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                className="h-4 w-4 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {exporting === format ? "Downloading…" : label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => (
            <StatResultItem key={stat.label} {...stat} />
          ))}
        </div>

        {charts && <div className="space-y-4">{charts}</div>}

        {downloads.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Download data</h3>
            <p className="mb-3 text-xs text-muted">
              Export your dataset or normalized values as CSV or Excel.
            </p>
            <div className="flex flex-col gap-3">
              {downloads.map((dataset) => (
                <div
                  key={dataset.filename}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{dataset.label}</p>
                    <p className="text-xs text-muted">{dataset.filename}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDataDownload(dataset, false)}
                      disabled={downloadingKey !== null}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingKey === `${dataset.filename}-csv` ? "Downloading…" : "CSV"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDataDownload(dataset, true)}
                      disabled={downloadingKey !== null}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingKey === `${dataset.filename}-excel` ? "Downloading…" : "Excel"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/40">
          <h3 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
            Interpretation
          </h3>
          <p className="text-sm leading-relaxed text-green-900 dark:text-green-100">
            {interpretation}
          </p>
        </div>

        {apaOutput && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
            <h3 className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
              APA Output
            </h3>
            <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
              {apaOutput}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
