"use client";

import { useEffect, useRef, useState } from "react";
import { getSampleCsvForTest, sampleCsvData } from "@/data/statisticalTests";
import {
  parseUploadedFile,
  SUPPORTED_DATA_FILE_ACCEPT,
} from "@/lib/parseUploadedFile";

type InputDataCardProps = {
  testId?: string;
  initialData?: string;
  onDataChange?: (data: string) => void;
  onRunAnalysis?: (data: string) => void;
  loading?: boolean;
  formatHint?: string;
};

export default function InputDataCard({
  testId,
  initialData,
  onDataChange,
  onRunAnalysis,
  loading = false,
  formatHint,
}: InputDataCardProps) {
  const resolvedSample = testId ? getSampleCsvForTest(testId) : sampleCsvData;
  const [data, setData] = useState(initialData ?? resolvedSample);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sample = getSampleCsvForTest(testId ?? "");
    setData(sample);
    setUploadError(null);
    onDataChange?.(sample);
  }, [testId, onDataChange]);

  const updateData = (value: string) => {
    setData(value);
    onDataChange?.(value);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      const content = await parseUploadedFile(file);
      updateData(content);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      event.target.value = "";
    }
  };

  const handleLoadSample = () => {
    const sample = getSampleCsvForTest(testId ?? "");
    updateData(sample);
    setUploadError(null);
  };

  const handleRunAnalysis = () => {
    onRunAnalysis?.(data);
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-base font-semibold text-foreground">Input Data</h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_DATA_FILE_ACCEPT}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload CSV / Excel
          </button>
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-sm font-medium text-primary transition-colors hover:text-primary-dark"
          >
            Load sample data
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <textarea
          value={data}
          onChange={(e) => updateData(e.target.value)}
          spellCheck={false}
          className="h-52 w-full resize-y rounded-lg border border-border bg-surface-muted p-4 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-3 text-xs text-muted">
          {formatHint ??
            "Upload CSV or Excel (.xlsx, .xls). First row = variable names (headers)."}
        </p>

        {uploadError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 btn-motion"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {loading ? "Running…" : "Run Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}
