import { getVariableFieldsForTest } from "@/lib/testVariableConfig";

export const OPTIONAL_GROUP_BY_TESTS = new Set([
  "summary-statistics",
  "histogram",
  "box-plot",
  "percentiles",
  "one-sample-ttest",
  "shapiro-wilk",
  "kolmogorov-smirnov",
  "anderson-darling",
]);

export function supportsOptionalGroupBy(testId: string): boolean {
  return OPTIONAL_GROUP_BY_TESTS.has(testId);
}

export function supportsDataPreview(testId: string): boolean {
  return testId !== "";
}

export function testHasRequiredGroupColumn(testId: string): boolean {
  return getVariableFieldsForTest(testId).some(
    (field) => field.key === "group_column" && field.required,
  );
}

export function showOptionalGroupBy(testId: string): boolean {
  return supportsOptionalGroupBy(testId) && !testHasRequiredGroupColumn(testId);
}
