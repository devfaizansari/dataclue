import * as XLSX from "xlsx";

const EXCEL_EXTENSIONS = new Set(["xlsx", "xls"]);

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function excelToCsv(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excel file has no worksheets");
  }
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
}

export async function parseUploadedFile(file: File): Promise<string> {
  const extension = getExtension(file.name);

  if (EXCEL_EXTENSIONS.has(extension)) {
    const buffer = await file.arrayBuffer();
    const csv = excelToCsv(buffer).trim();
    if (!csv) {
      throw new Error("Excel sheet is empty");
    }
    return csv;
  }

  const text = await file.text();
  if (!text.trim()) {
    throw new Error("File is empty");
  }
  return text;
}

export const SUPPORTED_DATA_FILE_ACCEPT =
  ".csv,.txt,.tsv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain";
