"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Container from "@/components/ui/Container";
import CalculatorSidebar from "./CalculatorSidebar";
import TestInfoCard from "./TestInfoCard";
import InputDataCard from "./InputDataCard";
import VariableSelector from "./VariableSelector";
import MetricsSelector from "./MetricsSelector";
import GroupAnalysisSelect from "./GroupAnalysisSelect";
import ClassificationModelSelector from "./ClassificationModelSelector";
import RegressionModelSelector from "./RegressionModelSelector";
import TimeSeriesModelSelector from "./TimeSeriesModelSelector";
import DataPreprocessingCard from "./DataPreprocessingCard";
import ClassificationResultsPanel from "./ClassificationResultsPanel";
import ResultsCard from "./ResultsCard";
import ResultsCharts from "./ResultsCharts";
import { defaultActiveTestId, getTestInfo } from "@/data/statisticalTests";
import { isValidTestId } from "@/lib/calculatorLinks";
import { buildDataPreview } from "@/lib/csvPreview";
import {
  parseDataColumns,
  runAnalysis,
  type AnalysisResponse,
  type DataVariable,
  ApiError,
} from "@/lib/api";
import {
  buildDefaultSelections,
  selectionsToOptions,
  validateVariableSelections,
} from "@/lib/testVariableConfig";
import {
  buildClassificationPayload,
  getDefaultAdvancedState,
  getDefaultClassificationOptions,
  type ClassificationAdvancedState,
  type PreprocessingSettings,
} from "@/lib/classificationAdvanced";
import {
  validateClassificationOptions,
  type ClassificationOptions,
} from "@/lib/classificationModels";
import {
  getDefaultSummaryOptions,
  summaryOptionsToPayload,
  validateSummaryOptions,
  type SummaryOptions,
} from "@/lib/summaryMetrics";
import {
  buildRegressionPayload,
  getDefaultAdvancedState as getDefaultRegressionAdvancedState,
  getDefaultRegressionOptions,
  type RegressionAdvancedState,
} from "@/lib/regressionAdvanced";
import {
  buildTimeSeriesPayload,
  getDefaultAdvancedState as getDefaultTimeSeriesAdvancedState,
  getDefaultTimeSeriesOptions,
  type TimeSeriesAdvancedState,
} from "@/lib/timeSeriesAdvanced";
import {
  validateTimeSeriesOptions,
  type TimeSeriesOptions,
} from "@/lib/timeSeriesModels";
import {
  validateRegressionOptions,
  type RegressionOptions,
} from "@/lib/regressionModels";
import {
  showOptionalGroupBy,
  supportsDataPreview,
} from "@/lib/testAnalysisUi";
import { EASE_OUT, fadeUp } from "@/lib/motion";
import Reveal from "@/components/motion/Reveal";
import BrandLoadingOverlay from "@/components/brand/BrandLoadingOverlay";
import {
  getDefaultFeatureTransformMethod,
  getDefaultNormalizationMethod,
  type FeatureTransformMethod,
} from "@/lib/featureTransform";
import FeatureTransformSelector from "./FeatureTransformSelector";
import RunAnalysisButton from "./RunAnalysisButton";
import { parseDownloadDatasets } from "@/lib/exportData";

const csvFormatHints: Record<string, string> = {
  "logistic-regression":
    "Select a binary outcome (0/1 or two categories) and numeric predictor variables.",
  "classification-models":
    "Select an outcome column (2+ classes) and numeric predictors, then pick a classifier and tune its settings.",
  "regression-models":
    "Select a numeric outcome (Y) and numeric predictors, then pick a regressor and tune its settings.",
  "time-series-models":
    "Select a date column and numeric value column, then choose a forecasting model (ARIMA, SARIMA, ETS, CNN, LSTM, or GRU).",
  "feature-scaling":
    "Select one or more numeric columns, choose a scaling or transformation method, then download the processed dataset.",
  "normalize-data":
    "Select numeric column(s), pick a normalization method (Quantile recommended), then download the normalized dataset.",
  "roc-curve": "Select a numeric score variable and a binary outcome variable.",
};

const REGRESSION_TESTS = new Set([
  "linear-regression",
  "multiple-regression",
  "polynomial-regression",
  "ridge-regression",
  "regression-models",
]);

function buildInitialColumnTypes(csvData: string) {
  const preview = buildDataPreview(csvData);
  if (!preview) return {};
  return Object.fromEntries(preview.columns.map((column) => [column.name, column.type]));
}

function getDefaultPreviewSettings(csvData = ""): PreprocessingSettings {
  return {
    missingValues: "drop",
    columnTypes: buildInitialColumnTypes(csvData),
  };
}

export default function CalculatorWorkspace() {
  const searchParams = useSearchParams();
  const [activeTestId, setActiveTestId] = useState(() => {
    const testFromUrl = searchParams.get("test");
    if (testFromUrl && isValidTestId(testFromUrl)) {
      return testFromUrl;
    }
    return defaultActiveTestId;
  });
  const [csvData, setCsvData] = useState("");
  const [variables, setVariables] = useState<DataVariable[]>([]);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [optionalGroupBy, setOptionalGroupBy] = useState("");
  const [previewSettings, setPreviewSettings] = useState<PreprocessingSettings>(
    getDefaultPreviewSettings(),
  );
  const [summaryOptions, setSummaryOptions] = useState<SummaryOptions>(getDefaultSummaryOptions());
  const [classificationOptions, setClassificationOptions] = useState<ClassificationOptions>(
    getDefaultClassificationOptions(),
  );
  const [advancedSettings, setAdvancedSettings] = useState<ClassificationAdvancedState>(
    getDefaultAdvancedState(),
  );
  const [regressionOptions, setRegressionOptions] = useState<RegressionOptions>(
    getDefaultRegressionOptions(),
  );
  const [regressionAdvanced, setRegressionAdvanced] = useState<RegressionAdvancedState>(
    getDefaultRegressionAdvancedState(),
  );
  const [timeSeriesOptions, setTimeSeriesOptions] = useState<TimeSeriesOptions>(
    getDefaultTimeSeriesOptions(),
  );
  const [timeSeriesAdvanced, setTimeSeriesAdvanced] = useState<TimeSeriesAdvancedState>(
    getDefaultTimeSeriesAdvancedState(),
  );
  const [featureTransformMethod, setFeatureTransformMethod] = useState<FeatureTransformMethod>(
    getDefaultFeatureTransformMethod(),
  );
  const [normalizationMethod, setNormalizationMethod] = useState<FeatureTransformMethod>(
    getDefaultNormalizationMethod(),
  );
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testInfo = getTestInfo(activeTestId);
  const isClassification = activeTestId === "classification-models";
  const isRegression = activeTestId === "regression-models";
  const isTimeSeries = activeTestId === "time-series-models";
  const isFeatureScaling = activeTestId === "feature-scaling";
  const isDataNormalization = activeTestId === "normalize-data";
  const showsTransformSelector = isFeatureScaling || isDataNormalization;
  const isMlModel = isClassification || isRegression || isTimeSeries;
  const showGroupBy = showOptionalGroupBy(activeTestId);
  const showPreview = supportsDataPreview(activeTestId) && csvData.trim().length > 0;

  useEffect(() => {
    const testFromUrl = searchParams.get("test");
    if (testFromUrl && isValidTestId(testFromUrl)) {
      setActiveTestId(testFromUrl);
      setResults(null);
      setError(null);
    }
  }, [searchParams]);

  const loadVariables = useCallback(
    async (data: string, testId: string) => {
      if (!data.trim()) {
        setVariables([]);
        setSelections({});
        return;
      }
      try {
        const cols = await parseDataColumns(data);
        setVariables(cols);
        setSelections(buildDefaultSelections(testId, cols));
        const columnTypes = buildInitialColumnTypes(data);
        setPreviewSettings((prev) => ({
          ...prev,
          columnTypes,
        }));
        if (testId === "classification-models") {
          setAdvancedSettings((prev) => ({
            ...prev,
            preprocessing: {
              ...prev.preprocessing,
              columnTypes,
            },
          }));
        }
        if (testId === "regression-models") {
          setRegressionAdvanced((prev) => ({
            ...prev,
            preprocessing: {
              ...prev.preprocessing,
              columnTypes,
            },
          }));
        }
        if (testId === "time-series-models") {
          setTimeSeriesAdvanced((prev) => ({
            ...prev,
            preprocessing: {
              ...prev.preprocessing,
              columnTypes,
            },
          }));
        }
        setError(null);
      } catch {
        setVariables([]);
      }
    },
    [],
  );

  useEffect(() => {
    if (csvData) {
      loadVariables(csvData, activeTestId);
    }
  }, [activeTestId, csvData, loadVariables]);

  const handleDataChange = useCallback((data: string) => {
    setCsvData(data);
    setResults(null);
    const columnTypes = buildInitialColumnTypes(data);
    setPreviewSettings((prev) => ({
      ...prev,
      columnTypes,
    }));
    if (activeTestId === "classification-models") {
      setAdvancedSettings((prev) => ({
        ...prev,
        preprocessing: {
          ...prev.preprocessing,
          columnTypes,
        },
      }));
    }
    if (activeTestId === "regression-models") {
      setRegressionAdvanced((prev) => ({
        ...prev,
        preprocessing: {
          ...prev.preprocessing,
          columnTypes,
        },
      }));
    }
    if (activeTestId === "time-series-models") {
      setTimeSeriesAdvanced((prev) => ({
        ...prev,
        preprocessing: {
          ...prev.preprocessing,
          columnTypes,
        },
      }));
    }
  }, [activeTestId]);

  const resultsAnchorRef = useRef<HTMLDivElement>(null);
  const runAnalysisAnchorRef = useRef<HTMLDivElement>(null);
  const pendingScrollToResultsRef = useRef(false);
  const [showStickyRunAnalysis, setShowStickyRunAnalysis] = useState(false);

  const scrollToResults = useCallback(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    requestAnimationFrame(() => {
      resultsAnchorRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }, []);

  useEffect(() => {
    if (!pendingScrollToResultsRef.current || loading) return;
    if (!results && !error) return;

    pendingScrollToResultsRef.current = false;
    scrollToResults();
  }, [results, error, loading, scrollToResults]);

  useEffect(() => {
    const anchor = runAnalysisAnchorRef.current;
    if (!anchor) {
      setShowStickyRunAnalysis(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyRunAnalysis(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -8px 0px" },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [activeTestId, csvData, variables.length]);

  const handleRunAnalysis = async (data: string) => {
    pendingScrollToResultsRef.current = true;

    const validationError = validateVariableSelections(activeTestId, variables, selections);
    if (validationError) {
      setError(validationError);
      setResults(null);
      return;
    }

    const metricsError = validateSummaryOptions(summaryOptions);
    if (metricsError) {
      setError(metricsError);
      setResults(null);
      return;
    }

    if (isClassification) {
      const modelError = validateClassificationOptions(classificationOptions);
      if (modelError) {
        setError(modelError);
        setResults(null);
        return;
      }
    }

    if (isRegression) {
      const modelError = validateRegressionOptions(regressionOptions);
      if (modelError) {
        setError(modelError);
        setResults(null);
        return;
      }
    }

    if (isTimeSeries) {
      const modelError = validateTimeSeriesOptions(timeSeriesOptions);
      if (modelError) {
        setError(modelError);
        setResults(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const options = selectionsToOptions(selections);

      if (showGroupBy && optionalGroupBy) {
        options.group_column = optionalGroupBy;
      }

      Object.assign(
        options,
        summaryOptionsToPayload(
          summaryOptions,
          showGroupBy && optionalGroupBy ? optionalGroupBy : undefined,
        ),
      );

      if (isClassification) {
        Object.assign(
          options,
          buildClassificationPayload(classificationOptions, advancedSettings),
        );
      }

      if (isRegression) {
        Object.assign(options, buildRegressionPayload(regressionOptions, regressionAdvanced));
      }

      if (isTimeSeries) {
        Object.assign(options, buildTimeSeriesPayload(timeSeriesOptions, timeSeriesAdvanced));
      }

      if (isFeatureScaling) {
        options.transform_method = featureTransformMethod;
      }

      if (isDataNormalization) {
        options.transform_method = normalizationMethod;
      }

      const response = await runAnalysis(activeTestId, data, options);
      setResults(response);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Analysis failed. Is the backend running?";
      setError(message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSelect = (testId: string) => {
    setActiveTestId(testId);
    setResults(null);
    setError(null);
    setOptionalGroupBy("");
    setSummaryOptions(getDefaultSummaryOptions());
    if (testId === "classification-models") {
      setClassificationOptions(getDefaultClassificationOptions());
      setAdvancedSettings(getDefaultAdvancedState());
    }
    if (testId === "regression-models") {
      setRegressionOptions(getDefaultRegressionOptions());
      setRegressionAdvanced(getDefaultRegressionAdvancedState());
    }
    if (testId === "time-series-models") {
      setTimeSeriesOptions(getDefaultTimeSeriesOptions());
      setTimeSeriesAdvanced(getDefaultTimeSeriesAdvancedState());
    }
    if (testId === "feature-scaling") {
      setFeatureTransformMethod(getDefaultFeatureTransformMethod());
    }
    if (testId === "normalize-data") {
      setNormalizationMethod(getDefaultNormalizationMethod());
    }
    if (variables.length > 0) {
      setSelections(buildDefaultSelections(testId, variables));
    }
  };

  const renderSingleResult = (result: AnalysisResponse, key?: string) => {
    if (result.test_id === "classification-models") {
      return <ClassificationResultsPanel key={key ?? result.title} result={result} />;
    }

    const stats = result.stats.map((s) => ({
      label: s.label,
      value: s.value,
      badge: s.badge
        ? { text: s.badge.text, variant: s.badge.variant as "success" | "warning" | "info" }
        : undefined,
    }));

    return (
      <ResultsCard
        key={key ?? result.variable_name ?? result.title}
        title={result.title}
        stats={stats}
        interpretation={result.interpretation}
        apaOutput={result.apa_output ?? undefined}
        downloads={parseDownloadDatasets(result.chart_data?.downloads)}
        charts={
          <ResultsCharts
            chartData={result.chart_data ?? {}}
            showRegression={REGRESSION_TESTS.has(result.test_id)}
          />
        }
      />
    );
  };

  const renderResults = () => {
    if (!results) return null;

    if (results.batch_results && results.batch_results.length > 0) {
      return (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted">
            {results.interpretation}
          </div>
          {results.batch_results.map((item) =>
            renderSingleResult(item, item.variable_name ?? item.title),
          )}
        </div>
      );
    }

    return renderSingleResult(results);
  };

  const preprocessingSettings = isClassification
    ? advancedSettings.preprocessing
    : isRegression
      ? regressionAdvanced.preprocessing
      : isTimeSeries
        ? timeSeriesAdvanced.preprocessing
        : previewSettings;

  const handlePreprocessingChange = (preprocessing: PreprocessingSettings) => {
    if (isClassification) {
      setAdvancedSettings((prev) => ({ ...prev, preprocessing }));
      return;
    }
    if (isRegression) {
      setRegressionAdvanced((prev) => ({ ...prev, preprocessing }));
      return;
    }
    if (isTimeSeries) {
      setTimeSeriesAdvanced((prev) => ({ ...prev, preprocessing }));
      return;
    }
    setPreviewSettings(preprocessing);
  };

  return (
    <section
      className={`relative bg-surface-muted py-8 ${showStickyRunAnalysis && csvData.trim() ? "pb-24" : ""}`}
    >
      <BrandLoadingOverlay show={loading} message="Computing your results" />
      <Container>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <CalculatorSidebar
            activeTestId={activeTestId}
            onTestSelect={handleTestSelect}
          />

          <div className="min-w-0 space-y-5">
            <Reveal>
              <TestInfoCard
                title={testInfo.title}
                description={testInfo.description}
              />
            </Reveal>
            <Reveal delay={0.05}>
              <InputDataCard
              testId={activeTestId}
              onDataChange={handleDataChange}
              onRunAnalysis={handleRunAnalysis}
              loading={loading}
              formatHint={csvFormatHints[activeTestId]}
              runAnalysisAnchorRef={runAnalysisAnchorRef}
              />
            </Reveal>

            {showPreview && (
              <Reveal delay={0.08}>
                <DataPreprocessingCard
                csvData={csvData}
                settings={preprocessingSettings}
                onChange={handlePreprocessingChange}
                showAdvancedControls={isMlModel}
                />
              </Reveal>
            )}

            {variables.length > 0 && (
              <Reveal delay={0.1}>
                <VariableSelector
                testId={activeTestId}
                variables={variables}
                selections={selections}
                onChange={setSelections}
                />
              </Reveal>
            )}

            {showGroupBy && variables.length > 0 && (
              <Reveal delay={0.12}>
                <GroupAnalysisSelect
                variables={variables}
                value={optionalGroupBy}
                onChange={setOptionalGroupBy}
                />
              </Reveal>
            )}

            {variables.length > 0 && !isMlModel && !showsTransformSelector && (
              <Reveal delay={0.14}>
                <MetricsSelector
                  options={summaryOptions}
                  onChange={setSummaryOptions}
                />
              </Reveal>
            )}

            {isClassification && variables.length > 0 && (
              <Reveal delay={0.16}>
                <ClassificationModelSelector
                options={classificationOptions}
                advanced={advancedSettings}
                onOptionsChange={setClassificationOptions}
                onAdvancedChange={setAdvancedSettings}
                />
              </Reveal>
            )}

            {isRegression && variables.length > 0 && (
              <Reveal delay={0.16}>
                <RegressionModelSelector
                options={regressionOptions}
                advanced={regressionAdvanced}
                onOptionsChange={setRegressionOptions}
                onAdvancedChange={setRegressionAdvanced}
                />
              </Reveal>
            )}

            {isTimeSeries && variables.length > 0 && (
              <Reveal delay={0.16}>
                <TimeSeriesModelSelector
                options={timeSeriesOptions}
                advanced={timeSeriesAdvanced}
                onOptionsChange={setTimeSeriesOptions}
                onAdvancedChange={setTimeSeriesAdvanced}
                />
              </Reveal>
            )}

            {isFeatureScaling && variables.length > 0 && (
              <Reveal delay={0.16}>
                <FeatureTransformSelector
                  value={featureTransformMethod}
                  onChange={setFeatureTransformMethod}
                  purpose="scaling"
                />
              </Reveal>
            )}

            {isDataNormalization && variables.length > 0 && (
              <Reveal delay={0.16}>
                <FeatureTransformSelector
                  value={normalizationMethod}
                  onChange={setNormalizationMethod}
                  purpose="normalization"
                />
              </Reveal>
            )}

            <div ref={resultsAnchorRef} className="scroll-mt-20" aria-hidden />

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                >
                  {error}
                </motion.div>
              )}

              {!loading && results && (
                <motion.div
                  key="results"
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  transition={{ duration: 0.55, ease: EASE_OUT }}
                >
                  {renderResults()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {showStickyRunAnalysis && csvData.trim() && (
          <motion.div
            key="sticky-run-analysis"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.2)] backdrop-blur supports-[backdrop-filter]:bg-surface/85"
          >
            <Container className="pointer-events-auto">
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="hidden lg:block" aria-hidden />
                <div className="flex items-center justify-between gap-4 py-3 pr-14 sm:pr-16">
                  <p className="hidden text-sm text-muted sm:block">
                    Scroll through options, then run when ready.
                  </p>
                  <RunAnalysisButton
                    loading={loading}
                    onClick={() => handleRunAnalysis(csvData)}
                    className="ml-auto shadow-md"
                  />
                </div>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
