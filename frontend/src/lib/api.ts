const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type StatBadge = {
  text: string;
  variant: "success" | "warning" | "info" | "neutral";
};

export type AnalysisStat = {
  label: string;
  value: string;
  badge?: StatBadge;
};

export type AnalysisResponse = {
  test_id: string;
  title: string;
  stats: AnalysisStat[];
  interpretation: string;
  apa_output?: string | null;
  chart_data?: Record<string, unknown> | null;
  batch_results?: AnalysisResponse[] | null;
  variable_name?: string | null;
};

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new ApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

export async function parseDataColumns(csvData: string): Promise<DataVariable[]> {
  const response = await request<{ variables: DataVariable[] }>("/parse-data", {
    method: "POST",
    body: JSON.stringify({ csv_data: csvData }),
  });
  return response.variables;
}

export type DataVariable = {
  name: string;
  type: "numeric" | "categorical";
  unique_count?: number;
  group_eligible?: boolean;
};

export async function runAnalysis(
  testId: string,
  csvData: string,
  options?: Record<string, unknown>,
): Promise<AnalysisResponse> {
  return request<AnalysisResponse>("/analyze", {
    method: "POST",
    body: JSON.stringify({
      test_id: testId,
      csv_data: csvData,
      options: options ?? {},
    }),
  });
}

export async function fetchHealth(): Promise<{ status: string }> {
  return request("/health");
}

export { ApiError };
