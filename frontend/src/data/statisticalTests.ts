export type StatisticalTest = {
  id: string;
  label: string;
  description?: string;
};

export type TestCategory = {
  id: string;
  label: string;
  tests: StatisticalTest[];
};

export const standaloneTests: StatisticalTest[] = [
  {
    id: "classification-models",
    label: "Classification Models",
    description:
      "Train machine learning classifiers with your choice of model, hyperparameters, and evaluation settings.",
  },
];

export const testCategories: TestCategory[] = [
  {
    id: "descriptive",
    label: "Descriptive Statistics",
    tests: [
      {
        id: "summary-statistics",
        label: "Summary Statistics",
        description:
          "Calculate mean, median, mode, standard deviation, variance, range, and quartiles for your data.",
      },
      {
        id: "frequency-table",
        label: "Frequency Table",
        description:
          "Generate frequency distributions and relative frequencies for categorical or grouped data.",
      },
      {
        id: "cross-tabulation",
        label: "Cross Tabulation",
        description:
          "Create contingency tables showing the joint distribution of two categorical variables.",
      },
      {
        id: "histogram",
        label: "Histogram",
        description:
          "Visualize the distribution of a continuous variable with customizable bin widths.",
      },
      {
        id: "box-plot",
        label: "Box Plot",
        description:
          "Display the five-number summary and identify outliers in your dataset.",
      },
      {
        id: "percentiles",
        label: "Percentiles & Quartiles",
        description:
          "Compute percentiles, quartiles, and interquartile range for any numeric variable.",
      },
    ],
  },
  {
    id: "hypothesis",
    label: "Hypothesis Tests",
    tests: [
      {
        id: "one-sample-ttest",
        label: "One-Sample t-Test",
        description:
          "Test whether the mean of a single sample differs significantly from a known or hypothesized population mean.",
      },
      {
        id: "independent-ttest",
        label: "Independent Samples t-Test",
        description:
          "Compare means between two independent groups to determine if there is a statistically significant difference.",
      },
      {
        id: "paired-ttest",
        label: "Paired Samples t-Test",
        description:
          "Compare means of two related groups to assess whether their population mean differences are statistically significant.",
      },
      {
        id: "one-way-anova",
        label: "One-Way ANOVA",
        description:
          "Compare means across three or more independent groups to determine if at least one group mean is significantly different.",
      },
      {
        id: "two-way-anova",
        label: "Two-Way ANOVA",
        description:
          "Examine the effect of two categorical independent variables on a continuous dependent variable.",
      },
      {
        id: "repeated-measures-anova",
        label: "Repeated Measures ANOVA",
        description:
          "Compare means across three or more related groups measured on the same subjects.",
      },
      {
        id: "chi-square",
        label: "Chi-Square Test",
        description:
          "Test for association between two categorical variables in a contingency table.",
      },
      {
        id: "fishers-exact",
        label: "Fisher's Exact Test",
        description:
          "Exact test for association in 2×2 contingency tables, especially useful with small sample sizes.",
      },
      {
        id: "mann-whitney",
        label: "Mann-Whitney U Test",
        description:
          "Non-parametric test to compare differences between two independent groups when data are not normally distributed.",
      },
      {
        id: "wilcoxon-signed-rank",
        label: "Wilcoxon Signed-Rank Test",
        description:
          "Non-parametric alternative to the paired t-test for comparing two related samples.",
      },
      {
        id: "kruskal-wallis",
        label: "Kruskal-Wallis Test",
        description:
          "Non-parametric alternative to one-way ANOVA for comparing three or more independent groups.",
      },
      {
        id: "friedman",
        label: "Friedman Test",
        description:
          "Non-parametric alternative to repeated measures ANOVA for comparing three or more related groups.",
      },
      {
        id: "mcnemar",
        label: "McNemar Test",
        description:
          "Test for changes in proportions for paired nominal data in a 2×2 table.",
      },
    ],
  },
  {
    id: "regression",
    label: "Regression Analysis",
    tests: [
      {
        id: "linear-regression",
        label: "Linear Regression",
        description:
          "Model the relationship between a dependent variable and one independent variable using ordinary least squares.",
      },
      {
        id: "multiple-regression",
        label: "Multiple Regression",
        description:
          "Predict a dependent variable using two or more independent variables simultaneously.",
      },
      {
        id: "logistic-regression",
        label: "Logistic Regression",
        description:
          "Model the probability of a binary outcome based on one or more predictor variables.",
      },
      {
        id: "polynomial-regression",
        label: "Polynomial Regression",
        description:
          "Fit a curved relationship between variables using polynomial terms.",
      },
      {
        id: "ridge-regression",
        label: "Ridge Regression",
        description:
          "Regularized regression that reduces overfitting by penalizing large coefficients.",
      },
    ],
  },
  {
    id: "correlation",
    label: "Correlation",
    tests: [
      {
        id: "pearson-correlation",
        label: "Pearson Correlation",
        description:
          "Measure the linear relationship between two continuous variables.",
      },
      {
        id: "spearman-correlation",
        label: "Spearman Correlation",
        description:
          "Rank-based measure of association between two variables, suitable for non-linear monotonic relationships.",
      },
      {
        id: "kendall-correlation",
        label: "Kendall Correlation",
        description:
          "Non-parametric measure of the ordinal association between two measured quantities.",
      },
      {
        id: "partial-correlation",
        label: "Partial Correlation",
        description:
          "Measure the relationship between two variables while controlling for the effect of one or more additional variables.",
      },
      {
        id: "point-biserial",
        label: "Point-Biserial Correlation",
        description:
          "Measure the correlation between a continuous variable and a dichotomous variable.",
      },
    ],
  },
  {
    id: "normality",
    label: "Normality Tests",
    tests: [
      {
        id: "shapiro-wilk",
        label: "Shapiro-Wilk Test",
        description:
          "Test whether a sample comes from a normally distributed population.",
      },
      {
        id: "kolmogorov-smirnov",
        label: "Kolmogorov-Smirnov Test",
        description:
          "Compare a sample distribution with a reference probability distribution.",
      },
      {
        id: "anderson-darling",
        label: "Anderson-Darling Test",
        description:
          "Test whether a given sample of data is drawn from a specified distribution.",
      },
      {
        id: "levene-test",
        label: "Levene's Test",
        description:
          "Test the equality of variances across groups in a sample.",
      },
      {
        id: "bartlett-test",
        label: "Bartlett's Test",
        description:
          "Test for homogeneity of variances across multiple groups, assuming normality.",
      },
    ],
  },
  {
    id: "other",
    label: "Other Methods",
    tests: [
      {
        id: "factor-analysis",
        label: "Factor Analysis",
        description:
          "Identify underlying latent variables that explain patterns in observed variables.",
      },
      {
        id: "cluster-analysis",
        label: "Cluster Analysis",
        description:
          "Group similar observations into clusters based on their characteristics.",
      },
      {
        id: "cronbach-alpha",
        label: "Cronbach's Alpha",
        description:
          "Assess the internal consistency and reliability of a scale or questionnaire.",
      },
      {
        id: "cohens-kappa",
        label: "Cohen's Kappa",
        description:
          "Measure inter-rater agreement for categorical items beyond chance agreement.",
      },
      {
        id: "roc-curve",
        label: "ROC Curve Analysis",
        description:
          "Evaluate the diagnostic ability of a binary classifier across different thresholds.",
      },
      {
        id: "power-analysis",
        label: "Power Analysis",
        description:
          "Determine the sample size needed to detect an effect of a given size with desired power.",
      },
    ],
  },
];

export const defaultActiveTestId = "independent-ttest";

export const sampleCsvData = `Age,Score,Group
23,78,A
25,85,A
22,90,A
24,76,A
26,82,A
27,58,B
29,64,B
28,70,B
30,62,B
31,68,B`;

export const sampleCsvByTest: Record<string, string> = {
  "logistic-regression": `Age,Score,Passed
23,78,1
25,85,1
22,90,1
24,76,1
26,82,1
27,58,0
29,64,0
28,70,0
30,62,0
31,68,0`,
  "classification-models": `Age,Score,Passed
23,78,1
25,85,1
22,90,1
24,76,1
26,82,1
27,58,0
29,64,0
28,70,0
30,62,0
31,68,0`,
  "roc-curve": `Score,Passed
78,1
85,1
90,1
76,1
82,1
58,0
64,0
70,0
62,0
68,0`,
  "point-biserial": `Group,Score
1,78
1,85
1,90
1,76
0,58
0,64
0,70
0,62`,
};

export function getSampleCsvForTest(testId: string): string {
  return sampleCsvByTest[testId] ?? sampleCsvData;
}

export function getTestById(testId: string): StatisticalTest | undefined {
  const standalone = standaloneTests.find((test) => test.id === testId);
  if (standalone) return standalone;

  for (const category of testCategories) {
    const test = category.tests.find((t) => t.id === testId);
    if (test) return test;
  }
  return undefined;
}

export function getTestInfo(testId: string) {
  const test = getTestById(testId);
  if (test) {
    return {
      title: test.label,
      description:
        test.description ??
        `Run ${test.label} analysis on your data and get instant results.`,
    };
  }

  const fallback = getTestById(defaultActiveTestId)!;
  return {
    title: fallback.label,
    description: fallback.description!,
  };
}

export const independentTTestResults = {
  title: "Independent Samples t-Test",
  stats: [
    { label: "t-statistic", value: "3.412" },
    { label: "Degrees of freedom", value: "8" },
    {
      label: "p-value (two-tailed)",
      value: "0.009",
      badge: { text: "Significant", variant: "success" as const },
    },
    {
      label: "Cohen's d",
      value: "0.682",
      badge: { text: "Medium effect", variant: "success" as const },
    },
    { label: "Mean Group A", value: "82.20" },
    { label: "Mean Group B", value: "66.20" },
  ],
  interpretation:
    "The independent samples t-test revealed a statistically significant difference between Group A (M = 82.20, SD = 5.89) and Group B (M = 66.20, SD = 4.97), t(8) = 3.41, p = .009, Cohen's d = 0.68. Group A scored significantly higher than Group B.",
  apaOutput:
    "An independent-samples t-test was conducted to compare scores for Group A (M = 82.20, SD = 5.89) and Group B (M = 66.20, SD = 4.97). There was a significant difference between the groups, t(8) = 3.41, p = .009, Cohen's d = 0.68.",
};
