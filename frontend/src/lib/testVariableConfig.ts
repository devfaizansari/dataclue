export type ColumnType = "numeric" | "categorical";

export type DataVariable = {
  name: string;
  type: ColumnType;
  unique_count?: number;
  group_eligible?: boolean;
};

export type VariableField = {
  key: string;
  label: string;
  type: ColumnType | "numeric[]";
  required?: boolean;
};

const singleNumeric: VariableField[] = [
  { key: "value_columns", label: "Variable(s)", type: "numeric[]", required: true },
];

const valueAndGroup: VariableField[] = [
  {
    key: "value_columns",
    label: "Dependent variable(s) (numeric)",
    type: "numeric[]",
    required: true,
  },
  { key: "group_column", label: "Group variable", type: "categorical", required: true },
];

const oneWayAnova: VariableField[] = [
  {
    key: "value_columns",
    label: "Dependent variable (long) or group columns (wide)",
    type: "numeric[]",
    required: true,
  },
  {
    key: "group_column",
    label: "Group variable (long format)",
    type: "categorical",
    required: false,
  },
];

const twoNumeric: VariableField[] = [
  { key: "x_column", label: "Variable X (numeric)", type: "numeric", required: true },
  { key: "y_column", label: "Variable Y (numeric)", type: "numeric", required: true },
];

const rowAndCol: VariableField[] = [
  { key: "row_column", label: "Row variable", type: "categorical", required: true },
  { key: "col_column", label: "Column variable", type: "categorical", required: true },
];

const TEST_FIELDS: Record<string, VariableField[]> = {
  "summary-statistics": singleNumeric,
  histogram: singleNumeric,
  "box-plot": singleNumeric,
  percentiles: singleNumeric,
  "one-sample-ttest": singleNumeric,
  "shapiro-wilk": singleNumeric,
  "kolmogorov-smirnov": singleNumeric,
  "anderson-darling": singleNumeric,
  "normalize-data": singleNumeric,
  "feature-scaling": singleNumeric,
  "frequency-table": [
    { key: "variable_column", label: "Variable", type: "categorical", required: true },
  ],
  "independent-ttest": valueAndGroup,
  "mann-whitney": valueAndGroup,
  "one-way-anova": oneWayAnova,
  "two-way-anova": [
    { key: "y_column", label: "Dependent variable (numeric)", type: "numeric", required: true },
    { key: "factor_a_column", label: "Factor A", type: "categorical", required: true },
    { key: "factor_b_column", label: "Factor B", type: "categorical", required: true },
  ],
  "kruskal-wallis": valueAndGroup,
  "levene-test": valueAndGroup,
  "bartlett-test": valueAndGroup,
  "paired-ttest": twoNumeric,
  "wilcoxon-signed-rank": twoNumeric,
  "pearson-correlation": twoNumeric,
  "spearman-correlation": twoNumeric,
  "kendall-correlation": twoNumeric,
  "partial-correlation": [
    { key: "x_column", label: "Variable X", type: "numeric", required: true },
    { key: "y_column", label: "Variable Y", type: "numeric", required: true },
    { key: "control_column", label: "Control variable", type: "numeric", required: true },
  ],
  "linear-regression": [
    { key: "y_column", label: "Dependent variable (Y)", type: "numeric", required: true },
    { key: "x_column", label: "Independent variable (X)", type: "numeric", required: true },
  ],
  "multiple-regression": [
    { key: "y_column", label: "Dependent variable (Y)", type: "numeric", required: true },
    { key: "predictor_columns", label: "Predictors (numeric)", type: "numeric[]", required: true },
  ],
  "polynomial-regression": twoNumeric,
  "ridge-regression": [
    { key: "y_column", label: "Dependent variable (Y)", type: "numeric", required: true },
    { key: "predictor_columns", label: "Predictors (numeric)", type: "numeric[]", required: true },
  ],
  "logistic-regression": [
    { key: "outcome_column", label: "Outcome (binary)", type: "categorical", required: true },
    { key: "predictor_columns", label: "Predictors (numeric)", type: "numeric[]", required: true },
  ],
  "roc-curve": [
    { key: "x_column", label: "Score variable (numeric)", type: "numeric", required: true },
    { key: "outcome_column", label: "Outcome (binary)", type: "categorical", required: true },
  ],
  "chi-square": rowAndCol,
  "fishers-exact": rowAndCol,
  mcnemar: rowAndCol,
  "cross-tabulation": rowAndCol,
  "cohens-kappa": rowAndCol,
  "classification-models": [
    { key: "outcome_column", label: "Outcome (target class)", type: "categorical", required: true },
    { key: "predictor_columns", label: "Predictors (numeric)", type: "numeric[]", required: true },
  ],
  "regression-models": [
    { key: "y_column", label: "Outcome (Y, numeric)", type: "numeric", required: true },
    { key: "predictor_columns", label: "Predictors (numeric)", type: "numeric[]", required: true },
  ],
  "time-series-models": [
    { key: "date_column", label: "Date / time column", type: "categorical", required: true },
    { key: "value_column", label: "Series value (numeric)", type: "numeric", required: true },
  ],
};

export function getVariableFieldsForTest(testId: string): VariableField[] {
  return TEST_FIELDS[testId] ?? singleNumeric;
}

const GROUP_NAME_PATTERN = /group|treatment|condition|category|arm|cohort|class|gender|sex/i;
const VALUE_NAME_PATTERN = /score|value|dependent|outcome|measure|result|rating/i;

function pickGroupColumn(variables: DataVariable[]): string {
  const eligible = variables.filter(
    (v) => v.group_eligible ?? (v.unique_count !== undefined ? v.unique_count >= 2 : v.type === "categorical"),
  );
  const byName = eligible.find((v) => GROUP_NAME_PATTERN.test(v.name));
  if (byName) return byName.name;

  const categorical = eligible.filter((v) => v.type === "categorical");
  if (categorical.length > 0) {
    return categorical.reduce((best, v) =>
      (v.unique_count ?? 0) > (best.unique_count ?? 0) ? v : best,
    ).name;
  }

  return eligible[0]?.name ?? "";
}

function pickValueColumn(variables: DataVariable[], groupColumn: string): string {
  const numeric = variables.filter((v) => v.type === "numeric" && v.name !== groupColumn);
  const byName = numeric.find((v) => VALUE_NAME_PATTERN.test(v.name));
  if (byName) return byName.name;
  if (numeric.length > 1) return numeric[1].name;
  return numeric[0]?.name ?? "";
}

export function buildDefaultSelections(
  testId: string,
  variables: DataVariable[],
): Record<string, string | string[]> {
  const fields = getVariableFieldsForTest(testId);
  const numeric = variables.filter((v) => v.type === "numeric").map((v) => v.name);
  const categorical = variables.filter((v) => v.type === "categorical").map((v) => v.name);
  const selections: Record<string, string | string[]> = {};
  const groupColumn = pickGroupColumn(variables);

  for (const field of fields) {
    if (field.type === "numeric[]") {
      if (field.key === "value_columns") {
        selections[field.key] = [pickValueColumn(variables, groupColumn)];
        continue;
      }
      const y = typeof selections.y_column === "string" ? selections.y_column : "";
      const outcome =
        typeof selections.outcome_column === "string" ? selections.outcome_column : "";
      selections[field.key] = numeric.filter((n) => n !== y && n !== outcome);
      if ((selections[field.key] as string[]).length === 0 && numeric.length > 1) {
        selections[field.key] = numeric.slice(1);
      }
      continue;
    }
    if (field.key === "group_column") {
      selections[field.key] = groupColumn;
      continue;
    }
    if (field.key === "date_column") {
      const byName = variables.find((v) => /date|time|month|period|timestamp/i.test(v.name));
      selections[field.key] = byName?.name ?? categorical[0] ?? variables[0]?.name ?? "";
      continue;
    }
    if (field.key === "value_column") {
      selections[field.key] = pickValueColumn(variables, "");
      continue;
    }
    if (field.key === "factor_a_column") {
      selections[field.key] = categorical[0] ?? "";
      continue;
    }
    if (field.key === "factor_b_column") {
      const factorA =
        typeof selections.factor_a_column === "string" ? selections.factor_a_column : "";
      selections[field.key] =
        categorical.find((name) => name !== factorA) ?? categorical[1] ?? "";
      continue;
    }
    if (field.type === "numeric") {
      const used = Object.values(selections).flat().filter((v) => typeof v === "string") as string[];
      const pick = numeric.find((n) => !used.includes(n)) ?? numeric[0] ?? "";
      selections[field.key] = pick;
      continue;
    }
    selections[field.key] = categorical[0] ?? "";
  }

  return selections;
}

export function validateVariableSelections(
  testId: string,
  variables: DataVariable[],
  selections: Record<string, string | string[]>,
): string | null {
  const fields = getVariableFieldsForTest(testId);
  for (const field of fields) {
    if (field.type === "numeric[]" && field.required) {
      const value = selections[field.key];
      if (!Array.isArray(value) || value.length === 0) {
        return `Select at least one ${field.label.toLowerCase()}.`;
      }
    }
    if (field.required && field.type === "categorical") {
      const value = selections[field.key];
      if (typeof value !== "string" || !value) {
        return `Select ${field.label.toLowerCase()}.`;
      }
    }
    if (field.required && field.type === "numeric") {
      const value = selections[field.key];
      if (typeof value !== "string" || !value) {
        return `Select ${field.label.toLowerCase()}.`;
      }
    }
  }

  if (testId === "one-way-anova") {
    const groupName = selections.group_column;
    const valueCols = selections.value_columns;
    const hasGroup = typeof groupName === "string" && groupName.length > 0;
    const hasWide = Array.isArray(valueCols) && valueCols.length >= 2;
    if (!hasGroup && !hasWide) {
      return "Select a group column (long format) or at least 2 numeric columns (wide format).";
    }
    if (hasGroup) {
      const groupVar = variables.find((item) => item.name === groupName);
      if (groupVar?.unique_count !== undefined && groupVar.unique_count < 2) {
        return `Column "${groupName}" has only one category. Pick a column like Group with values A and B.`;
      }
    }
  }

  if (testId === "two-way-anova") {
    const factorA = selections.factor_a_column;
    const factorB = selections.factor_b_column;
    const yColumn = selections.y_column;
    if (typeof factorA === "string" && typeof factorB === "string" && factorA === factorB) {
      return "Factor A and Factor B must be different columns.";
    }
    if (typeof yColumn === "string") {
      if (yColumn === factorA || yColumn === factorB) {
        return "Dependent variable must be different from both factors.";
      }
    }
    for (const key of ["factor_a_column", "factor_b_column"] as const) {
      const name = selections[key];
      if (typeof name !== "string" || !name) continue;
      const variable = variables.find((item) => item.name === name);
      if (variable?.unique_count !== undefined && variable.unique_count < 2) {
        return `Column "${name}" has only one category. Choose a factor with at least 2 levels.`;
      }
    }
  }

  return validateGroupSelections(testId, variables, selections);
}

export function validateGroupSelections(
  testId: string,
  variables: DataVariable[],
  selections: Record<string, string | string[]>,
): string | null {
  const fields = getVariableFieldsForTest(testId);
  const needsGroup = fields.some((f) => f.key === "group_column" && f.required);
  if (!needsGroup) return null;

  const groupName = selections.group_column;
  if (typeof groupName !== "string" || !groupName) {
    return "Select a group variable with at least 2 different categories (e.g. A and B).";
  }

  const groupVar = variables.find((v) => v.name === groupName);
  if (groupVar && groupVar.unique_count !== undefined && groupVar.unique_count < 2) {
    return `Column "${groupName}" has only one category. Pick a column like Group with values A and B.`;
  }

  return null;
}

export function selectionsToOptions(
  selections: Record<string, string | string[]>,
): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(selections)) {
    if (Array.isArray(value) ? value.length > 0 : value) {
      options[key] = value;
    }
  }
  return options;
}
