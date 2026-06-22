export type ColumnType = "numeric" | "categorical";

export type PreviewColumn = {
  name: string;
  type: ColumnType;
};

export type DataPreview = {
  columns: PreviewColumn[];
  rows: string[][];
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function inferType(values: string[]): ColumnType {
  const nonEmpty = values.filter((v) => v !== "");
  if (nonEmpty.length === 0) return "categorical";
  const numericCount = nonEmpty.filter((v) => !Number.isNaN(Number(v))).length;
  return numericCount / nonEmpty.length >= 0.8 ? "numeric" : "categorical";
}

function normalizeRows(headers: string[], rows: string[][]): string[][] {
  const columnCount = Math.max(headers.length, ...rows.map((row) => row.length));
  return rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index] ?? ""),
  );
}

function isBlankColumn(headers: string[], rows: string[][], index: number): boolean {
  if ((headers[index] ?? "").trim()) return false;
  return rows.every((row) => !(row[index] ?? "").trim());
}

function displayColumnName(rawName: string, index: number): string {
  const trimmed = rawName.trim();
  return trimmed || `Column ${index + 1}`;
}

export function buildDataPreview(csvData: string, maxRows = 5): DataPreview | null {
  const lines = csvData
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]);
  const dataLines = normalizeRows(headers, lines.slice(1, maxRows + 1).map(parseCsvLine));

  const keptIndexes = headers
    .map((_, index) => index)
    .filter((index) => !isBlankColumn(headers, dataLines, index));

  if (keptIndexes.length === 0) return null;

  const columns: PreviewColumn[] = keptIndexes.map((index) => ({
    name: displayColumnName(headers[index] ?? "", index),
    type: inferType(dataLines.map((row) => row[index] ?? "")),
  }));

  const rows = dataLines.map((row) => keptIndexes.map((index) => row[index] ?? ""));

  return { columns, rows };
}
