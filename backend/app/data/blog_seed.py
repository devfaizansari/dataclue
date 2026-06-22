"""Initial blog posts seeded into MongoDB when the collection is empty."""

BLOG_SEED_DATA = [
    {
        "slug": "independent-t-test-guide",
        "title": "A Complete Guide to the Independent Samples t-Test",
        "excerpt": (
            "Learn when to use an independent t-test, how to interpret p-values, "
            "and what assumptions you need to check before running your analysis."
        ),
        "category": "Hypothesis Testing",
        "author": "Dr. Sarah Mitchell",
        "date": "2026-03-12",
        "read_time": "8 min read",
        "published": True,
        "content": [
            {
                "type": "paragraph",
                "text": (
                    "The independent samples t-test is one of the most widely used statistical "
                    "tests in research. It allows you to compare the means of two unrelated groups "
                    "— for example, comparing test scores between a control group and a treatment group."
                ),
            },
            {"type": "heading", "text": "When should you use it?"},
            {
                "type": "list",
                "items": [
                    "You have one continuous dependent variable (e.g., score, height, reaction time).",
                    "You have two independent groups with no overlap between participants.",
                    "Your data is approximately normally distributed within each group.",
                    "Variances between groups are roughly equal (use Levene's test to verify).",
                ],
            },
            {"type": "heading", "text": "Interpreting your results"},
            {
                "type": "paragraph",
                "text": (
                    "After running the test, focus on three key outputs: the t-statistic, degrees "
                    "of freedom, and p-value. A p-value below 0.05 typically indicates a statistically "
                    "significant difference between group means. Always report effect sizes like Cohen's "
                    "d alongside p-values for a complete picture."
                ),
            },
            {
                "type": "paragraph",
                "text": (
                    "With dataclue, you can run an independent t-test in seconds — paste your CSV data, "
                    "click Run Analysis, and get APA-formatted output ready for your thesis or publication."
                ),
            },
        ],
    },
    {
        "slug": "anova-vs-t-test",
        "title": "ANOVA vs t-Test: Which One Should You Choose?",
        "excerpt": (
            "Understand the key differences between ANOVA and t-tests, and learn how to pick "
            "the right test for your research design."
        ),
        "category": "Hypothesis Testing",
        "author": "James Keller",
        "date": "2026-02-28",
        "read_time": "6 min read",
        "published": True,
        "content": [
            {
                "type": "paragraph",
                "text": (
                    "Choosing between a t-test and ANOVA depends on how many groups you're comparing. "
                    "A t-test handles two groups; ANOVA handles three or more. Running multiple t-tests "
                    "instead of ANOVA increases your risk of Type I errors."
                ),
            },
            {"type": "heading", "text": "Quick decision guide"},
            {
                "type": "list",
                "items": [
                    "2 groups, independent → Independent Samples t-Test",
                    "2 groups, related/paired → Paired Samples t-Test",
                    "3+ groups, independent → One-Way ANOVA",
                    "3+ groups, related → Repeated Measures ANOVA",
                ],
            },
            {
                "type": "paragraph",
                "text": (
                    "If ANOVA is significant, follow up with post-hoc tests (like Tukey's HSD) to "
                    "identify which specific groups differ. dataclue provides these follow-up analyses automatically."
                ),
            },
        ],
    },
    {
        "slug": "pearson-correlation-explained",
        "title": "Pearson Correlation: Measuring Linear Relationships",
        "excerpt": (
            "Discover how Pearson's r quantifies the strength and direction of linear relationships "
            "between two continuous variables."
        ),
        "category": "Correlation",
        "author": "Prof. Elena Rodriguez",
        "date": "2026-02-15",
        "read_time": "5 min read",
        "published": True,
        "content": [
            {
                "type": "paragraph",
                "text": (
                    "Pearson's correlation coefficient (r) ranges from -1 to +1. A value of +1 indicates "
                    "a perfect positive linear relationship, -1 a perfect negative one, and 0 no linear "
                    "relationship at all."
                ),
            },
            {"type": "heading", "text": "Effect size guidelines"},
            {
                "type": "list",
                "items": [
                    "|r| = 0.10 to 0.29 → Small effect",
                    "|r| = 0.30 to 0.49 → Medium effect",
                    "|r| = 0.50 to 1.00 → Large effect",
                ],
            },
            {
                "type": "paragraph",
                "text": (
                    "Remember: correlation does not imply causation. Always consider confounding variables "
                    "and study design before drawing causal conclusions from correlational data."
                ),
            },
        ],
    },
    {
        "slug": "linear-regression-basics",
        "title": "Linear Regression Basics for Researchers",
        "excerpt": (
            "A beginner-friendly introduction to simple linear regression, R-squared, and how to "
            "report regression results in APA format."
        ),
        "category": "Regression",
        "author": "Dr. Sarah Mitchell",
        "date": "2026-01-30",
        "read_time": "10 min read",
        "published": True,
        "content": [
            {
                "type": "paragraph",
                "text": (
                    "Linear regression models the relationship between a dependent variable (Y) and one or "
                    "more independent variables (X). Simple linear regression uses one predictor; multiple "
                    "regression uses two or more."
                ),
            },
            {"type": "heading", "text": "Key outputs to report"},
            {
                "type": "list",
                "items": [
                    "R² — proportion of variance in Y explained by X",
                    "Coefficients (B) — change in Y per unit change in X",
                    "p-values — statistical significance of each predictor",
                    "F-statistic — overall model significance",
                ],
            },
            {
                "type": "paragraph",
                "text": (
                    "Check residual plots for homoscedasticity and normality assumptions. dataclue's "
                    "regression module includes diagnostic statistics to help you validate your model."
                ),
            },
        ],
    },
    {
        "slug": "normality-tests-overview",
        "title": "Testing for Normality: Shapiro-Wilk vs Kolmogorov-Smirnov",
        "excerpt": (
            "Compare the most popular normality tests and learn which one works best for your "
            "sample size and data type."
        ),
        "category": "Normality",
        "author": "James Keller",
        "date": "2026-01-18",
        "read_time": "7 min read",
        "published": True,
        "content": [
            {
                "type": "paragraph",
                "text": (
                    "Many parametric tests assume your data is normally distributed. Before running a "
                    "t-test or ANOVA, it's good practice to test this assumption formally."
                ),
            },
            {"type": "heading", "text": "Which test to choose?"},
            {
                "type": "list",
                "items": [
                    "Shapiro-Wilk — Best for small to medium samples (n < 50)",
                    "Kolmogorov-Smirnov — Better for larger samples",
                    "Anderson-Darling — More sensitive to tail deviations",
                    "Visual check — Always supplement with a Q-Q plot or histogram",
                ],
            },
            {
                "type": "paragraph",
                "text": (
                    "If normality is violated, consider non-parametric alternatives like Mann-Whitney U "
                    "or Kruskal-Wallis, both available in dataclue's calculator."
                ),
            },
        ],
    },
    {
        "slug": "apa-format-statistics",
        "title": "How to Report Statistics in APA 7th Edition Format",
        "excerpt": (
            "Master APA-style reporting for t-tests, ANOVA, correlation, and regression with "
            "practical examples you can copy into your thesis."
        ),
        "category": "Research Tips",
        "author": "Prof. Elena Rodriguez",
        "date": "2026-01-05",
        "read_time": "9 min read",
        "published": True,
        "content": [
            {
                "type": "paragraph",
                "text": (
                    "Proper statistical reporting is essential for academic credibility. APA 7th Edition "
                    "provides clear guidelines for reporting test statistics, degrees of freedom, p-values, "
                    "and effect sizes."
                ),
            },
            {"type": "heading", "text": "Example formats"},
            {
                "type": "list",
                "items": [
                    "t-test: t(18) = 2.45, p = .024, d = 0.82",
                    "ANOVA: F(2, 57) = 4.32, p = .017, η² = .13",
                    "Correlation: r(48) = .67, p < .001",
                    "Regression: R² = .42, F(3, 96) = 18.7, p < .001",
                ],
            },
            {
                "type": "paragraph",
                "text": (
                    "dataclue automatically generates APA-formatted output for every analysis, saving you "
                    "time and reducing formatting errors in your research papers."
                ),
            },
        ],
    },
]
