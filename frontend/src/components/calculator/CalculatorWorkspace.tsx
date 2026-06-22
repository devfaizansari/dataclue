"use client";

import { useCallback, useEffect, useState } from "react";
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
  showOptionalGroupBy,
  supportsDataPreview,
} from "@/lib/testAnalysisUi";
import { EASE_OUT, fadeUp } from "@/lib/motion";
import Reveal from "@/components/motion/Reveal";
import BrandLoadingOverlay from "@/components/brand/BrandLoadingOverlay";

const csvFormatHints: Record<string, string> = {
  "logistic-regression":
    "Select a binary outcome (0/1 or two categories) and numeric predictor variables.",
  "classification-models":
    "Select an outcome column (2+ classes) and numeric predictors, then pick a classifier and tune its settings.",
  "roc-curve": "Select a numeric score variable and a binary outcome variable.",
};

const REGRESSION_TESTS = new Set([
  "linear-regression",
  "multiple-regression",
  "polynomial-regression",
  "ridge-regression",
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
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testInfo = getTestInfo(activeTestId);
  const isClassification = activeTestId === "classification-models";
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
  }, [activeTestId]);

  const handleRunAnalysis = async (data: string) => {
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
    : previewSettings;

  const handlePreprocessingChange = (preprocessing: PreprocessingSettings) => {
    if (isClassification) {
      setAdvancedSettings((prev) => ({ ...prev, preprocessing }));
      return;
    }
    setPreviewSettings(preprocessing);
  };

  return (
    <section className="relative bg-surface-muted py-8">
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
              />
            </Reveal>

            {showPreview && (
              <Reveal delay={0.08}>
                <DataPreprocessingCard
                csvData={csvData}
                settings={preprocessingSettings}
                onChange={handlePreprocessingChange}
                showAdvancedControls={isClassification}
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

            {variables.length > 0 && (
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
    </section>
  );
}
