import { getTestById } from "@/data/statisticalTests";

export function getCalculatorHref(testId: string): string {
  return `/calculator?test=${encodeURIComponent(testId)}`;
}

export function isValidTestId(testId: string): boolean {
  return Boolean(getTestById(testId));
}

export const HOME_METHOD_LINKS = [
  { label: "One-Sample t-Test", testId: "one-sample-ttest" },
  { label: "Independent t-Test", testId: "independent-ttest" },
  { label: "Paired t-Test", testId: "paired-ttest" },
  { label: "One-Way ANOVA", testId: "one-way-anova" },
  { label: "Two-Way ANOVA", testId: "two-way-anova" },
  { label: "Repeated Measures ANOVA", testId: "repeated-measures-anova" },
  { label: "Chi-Square Test", testId: "chi-square" },
  { label: "Fisher's Exact Test", testId: "fishers-exact" },
  { label: "Mann-Whitney U", testId: "mann-whitney" },
  { label: "Wilcoxon Signed-Rank", testId: "wilcoxon-signed-rank" },
  { label: "Kruskal-Wallis", testId: "kruskal-wallis" },
  { label: "Friedman Test", testId: "friedman" },
  { label: "Pearson Correlation", testId: "pearson-correlation" },
  { label: "Spearman Correlation", testId: "spearman-correlation" },
  { label: "Linear Regression", testId: "linear-regression" },
  { label: "Logistic Regression", testId: "logistic-regression" },
  { label: "Classification Models", testId: "classification-models" },
  { label: "Multiple Regression", testId: "multiple-regression" },
  { label: "Factor Analysis", testId: "factor-analysis" },
  { label: "Cluster Analysis", testId: "cluster-analysis" },
  { label: "Cronbach's Alpha", testId: "cronbach-alpha" },
  { label: "Normality Test", testId: "shapiro-wilk" },
  { label: "Levene's Test", testId: "levene-test" },
  { label: "McNemar Test", testId: "mcnemar" },
  { label: "Cohen's Kappa", testId: "cohens-kappa" },
] as const;

export const HOME_FEATURE_LINKS = [
  { title: "Descriptive Statistics", testId: "summary-statistics" },
  { title: "Hypothesis Tests", testId: "independent-ttest" },
  { title: "Regression Analysis", testId: "linear-regression" },
  { title: "Correlation & Association", testId: "pearson-correlation" },
  { title: "Data Visualization", testId: "histogram" },
  { title: "Export Results", testId: "summary-statistics" },
] as const;
