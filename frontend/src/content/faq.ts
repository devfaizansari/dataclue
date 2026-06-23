export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "Is my data uploaded to the cloud?",
    answer:
      "When you run an analysis, your dataset is sent to our servers only for processing the statistical test you selected. We do not sell your data, and we do not use it to train machine learning models. Analysis data is processed transiently to return results.",
  },
  {
    question: "Do I need to install any software?",
    answer:
      "No. dataclue runs entirely in your browser. Open the calculator, paste or type your data, choose a test, and get results instantly — no Python, R, SPSS, or Minitab required.",
  },
  {
    question: "What statistical tests are supported?",
    answer:
      "dataclue supports a wide range of tests including t-tests, ANOVA, correlation, regression, chi-square, non-parametric tests, classification models, regression models, and time series forecasting. Browse the calculator sidebar for the full list.",
  },
  {
    question: "What data format should I use?",
    answer:
      "Paste tabular data in CSV format — comma-separated values with a header row. Each column should represent a variable, and each row a participant or observation. The calculator will automatically detect numeric and categorical columns.",
  },
  {
    question: "Are results formatted for academic papers?",
    answer:
      "Yes. Many tests include APA-style output alongside plain-language interpretation, making it easier to report findings in theses, journal articles, and research reports.",
  },
  {
    question: "Is dataclue free to use?",
    answer:
      "The core statistical calculator is free to use. We may introduce premium features in the future, but basic analysis will remain accessible.",
  },
  {
    question: "Can I use dataclue on mobile?",
    answer:
      "Yes. The site is responsive and works on phones and tablets, though complex analyses with large datasets are easiest on a desktop or laptop.",
  },
  {
    question: "How do I report a bug or request a feature?",
    answer:
      "Use our Contact page to send feedback, report issues, or suggest new statistical tests. We read every message and use your input to improve the platform.",
  },
];
