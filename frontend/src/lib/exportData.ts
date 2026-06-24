import * as XLSX from "xlsx";

export type DownloadableDataset = {
  label: string;
  filename: string;
  content: string;
  format?: "csv" | "excel";
};

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsvContent(content: string, filename: string): void {
  const normalized = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  triggerDownload(new Blob([content], { type: "text/csv;charset=utf-8;" }), normalized);
}

export function downloadExcelFromCsvContent(content: string, filename: string): void {
  const base = filename.replace(/\.(csv|xlsx)$/i, "");
  const workbook = XLSX.read(content, { type: "string" });
  XLSX.writeFile(workbook, `${base}.xlsx`);
}

export function downloadDataset(dataset: DownloadableDataset, asExcel = false): void {
  if (asExcel || dataset.format === "excel") {
    downloadExcelFromCsvContent(dataset.content, dataset.filename);
    return;
  }
  downloadCsvContent(dataset.content, dataset.filename);
}

export function parseDownloadDatasets(value: unknown): DownloadableDataset[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is DownloadableDataset =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof (item as DownloadableDataset).label === "string" &&
            typeof (item as DownloadableDataset).filename === "string" &&
            typeof (item as DownloadableDataset).content === "string",
        ),
    )
    .map((item) => ({
      label: item.label,
      filename: item.filename,
      content: item.content,
      format: item.format === "excel" ? "excel" : "csv",
    }));
}
