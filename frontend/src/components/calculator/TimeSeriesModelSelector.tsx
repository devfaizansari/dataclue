"use client";

import {
  GENERAL_CONTROLS,
  TIME_SERIES_MODELS,
  getDefaultHyperparameters,
  getTimeSeriesModel,
  type ModelParam,
  type TimeSeriesModelId,
  type TimeSeriesOptions,
} from "@/lib/timeSeriesModels";
import type {
  PreprocessingSettings,
  TimeSeriesAdvancedState,
} from "@/lib/timeSeriesAdvanced";

type TimeSeriesModelSelectorProps = {
  options: TimeSeriesOptions;
  advanced: TimeSeriesAdvancedState;
  onOptionsChange: (options: TimeSeriesOptions) => void;
  onAdvancedChange: (advanced: TimeSeriesAdvancedState) => void;
};

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: ModelParam;
  value: number | string | boolean;
  onChange: (value: number | string | boolean) => void;
}) {
  if (param.type === "select") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{param.label}</label>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {param.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{param.label}</label>
      <input
        type="number"
        value={Number(value)}
        min={param.min}
        max={param.max}
        step={param.step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {param.help && <p className="mt-1 text-xs text-muted">{param.help}</p>}
    </div>
  );
}

export default function TimeSeriesModelSelector({
  options,
  advanced,
  onOptionsChange,
  onAdvancedChange,
}: TimeSeriesModelSelectorProps) {
  const selectedModel = getTimeSeriesModel(options.model);

  const updateOptions = (patch: Partial<TimeSeriesOptions>) => {
    onOptionsChange({ ...options, ...patch });
  };

  const updateGeneral = (key: string, value: number | string | boolean) => {
    updateOptions({ [key]: value } as Partial<TimeSeriesOptions>);
  };

  const updateHyperparameter = (key: string, value: number | string | boolean) => {
    updateOptions({
      hyperparameters: { ...options.hyperparameters, [key]: value },
    });
  };

  const updatePreprocessing = (patch: Partial<PreprocessingSettings>) => {
    onAdvancedChange({
      ...advanced,
      preprocessing: { ...advanced.preprocessing, ...patch },
    });
  };

  const handleModelChange = (modelId: TimeSeriesModelId) => {
    onOptionsChange({
      ...options,
      model: modelId,
      hyperparameters: getDefaultHyperparameters(modelId),
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-foreground">Forecast model</h2>
          <p className="mt-1 text-xs text-muted">{selectedModel.description}</p>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Model</label>
            <select
              value={options.model}
              onChange={(e) => handleModelChange(e.target.value as TimeSeriesModelId)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TIME_SERIES_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {GENERAL_CONTROLS.map((param) => (
              <ParamControl
                key={param.key}
                param={param}
                value={options[param.key as keyof TimeSeriesOptions] as number | string | boolean}
                onChange={(value) => updateGeneral(param.key, value)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <button
          type="button"
          onClick={() => onAdvancedChange({ ...advanced, showAdvanced: !advanced.showAdvanced })}
          className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
        >
          <div>
            <h2 className="text-base font-semibold text-foreground">Advanced settings</h2>
            <p className="mt-1 text-xs text-muted">Data cleaning and model hyperparameters.</p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
            {advanced.showAdvanced ? "ON" : "OFF"}
          </span>
        </button>

        {advanced.showAdvanced && (
          <div className="space-y-6 border-t border-border p-5 sm:p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Missing values handling
              </label>
              <select
                value={advanced.preprocessing.missingValues}
                onChange={(e) =>
                  updatePreprocessing({
                    missingValues: e.target.value as PreprocessingSettings["missingValues"],
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
              >
                <option value="drop">Drop rows</option>
                <option value="impute_mean">Impute (mean)</option>
                <option value="impute_median">Impute (median)</option>
                <option value="none">No action</option>
              </select>
            </div>

            {selectedModel.params.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {selectedModel.label} hyperparameters
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedModel.params.map((param) => (
                    <ParamControl
                      key={param.key}
                      param={param}
                      value={options.hyperparameters[param.key] ?? param.default}
                      onChange={(value) => updateHyperparameter(param.key, value)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
