"use client";

import {
  GENERAL_CONTROLS,
  REGRESSION_MODELS,
  getDefaultHyperparameters,
  getRegressionModel,
  type ModelParam,
  type RegressionModelId,
  type RegressionOptions,
} from "@/lib/regressionModels";
import type {
  AdvancedTrainingSettings,
  FeatureEngineeringSettings,
  PreprocessingSettings,
  RegressionAdvancedState,
} from "@/lib/regressionAdvanced";

type RegressionModelSelectorProps = {
  options: RegressionOptions;
  advanced: RegressionAdvancedState;
  onOptionsChange: (options: RegressionOptions) => void;
  onAdvancedChange: (advanced: RegressionAdvancedState) => void;
};

function ParamControl({
  param,
  value,
  onChange,
  disabled = false,
}: {
  param: ModelParam;
  value: number | string | boolean;
  onChange: (value: number | string | boolean) => void;
  disabled?: boolean;
}) {
  if (param.type === "boolean") {
    return (
      <label
        className={`flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
        />
        <span className="text-sm font-medium text-foreground">{param.label}</span>
      </label>
    );
  }

  if (param.type === "select") {
    return (
      <div className={disabled ? "opacity-60" : ""}>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{param.label}</label>
        <select
          value={String(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed"
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
    <div className={disabled ? "opacity-60" : ""}>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{param.label}</label>
      <input
        type="number"
        value={Number(value)}
        min={param.min}
        max={param.max}
        step={param.step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed"
      />
      {param.help && <p className="mt-1 text-xs text-muted">{param.help}</p>}
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  help?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  );
}

export default function RegressionModelSelector({
  options,
  advanced,
  onOptionsChange,
  onAdvancedChange,
}: RegressionModelSelectorProps) {
  const selectedModel = getRegressionModel(options.model);

  const updateOptions = (patch: Partial<RegressionOptions>) => {
    onOptionsChange({ ...options, ...patch });
  };

  const updateGeneral = (key: string, value: number | string | boolean) => {
    updateOptions({ [key]: value } as Partial<RegressionOptions>);
  };

  const updateHyperparameter = (key: string, value: number | string | boolean) => {
    updateOptions({
      hyperparameters: { ...options.hyperparameters, [key]: value },
    });
  };

  const updateAdvanced = (patch: Partial<RegressionAdvancedState>) => {
    onAdvancedChange({ ...advanced, ...patch });
  };

  const updateTraining = (patch: Partial<AdvancedTrainingSettings>) => {
    updateAdvanced({ training: { ...advanced.training, ...patch } });
  };

  const updateFeatures = (patch: Partial<FeatureEngineeringSettings>) => {
    updateAdvanced({ features: { ...advanced.features, ...patch } });
  };

  const updatePreprocessing = (patch: Partial<PreprocessingSettings>) => {
    updateAdvanced({ preprocessing: { ...advanced.preprocessing, ...patch } });
  };

  const handleModelChange = (modelId: RegressionModelId) => {
    const model = getRegressionModel(modelId);
    onOptionsChange({
      ...options,
      model: modelId,
      scale_features: model.defaultScaleFeatures,
      hyperparameters: getDefaultHyperparameters(modelId),
    });
    updateFeatures({ scaleFeatures: model.defaultScaleFeatures });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-foreground">Model Selection</h2>
          <p className="mt-1 text-xs text-muted">{selectedModel.description}</p>
        </div>
        <div className="p-5 sm:p-6">
          <label className="mb-1.5 block text-sm font-medium text-foreground">Regressor</label>
          <select
            value={options.model}
            onChange={(e) => handleModelChange(e.target.value as RegressionModelId)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {REGRESSION_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <button
          type="button"
          onClick={() => updateAdvanced({ showAdvanced: !advanced.showAdvanced })}
          className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
        >
          <div>
            <h2 className="text-base font-semibold text-foreground">Advanced Settings</h2>
            <p className="mt-1 text-xs text-muted">
              Preprocessing, validation, feature engineering, and hyperparameters.
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
            {advanced.showAdvanced ? "ON" : "OFF"}
          </span>
        </button>

        {advanced.showAdvanced && (
          <div className="space-y-6 border-t border-border p-5 sm:p-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Data cleaning</h3>
              <FieldSelect
                label="Missing values handling"
                value={advanced.preprocessing.missingValues}
                onChange={(value) =>
                  updatePreprocessing({
                    missingValues: value as PreprocessingSettings["missingValues"],
                  })
                }
                options={[
                  { value: "drop", label: "Drop rows" },
                  { value: "impute_mean", label: "Impute (Mean)" },
                  { value: "impute_median", label: "Impute (Median)" },
                  { value: "none", label: "No action" },
                ]}
              />
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Training & validation</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {GENERAL_CONTROLS.filter((param) => param.key !== "scale_features").map((param) => (
                  <ParamControl
                    key={param.key}
                    param={param}
                    value={
                      options[param.key as keyof RegressionOptions] as number | string | boolean
                    }
                    onChange={(value) => updateGeneral(param.key, value)}
                  />
                ))}
                <FieldSelect
                  label="Validation strategy"
                  value={advanced.training.validationStrategy}
                  onChange={(value) =>
                    updateTraining({
                      validationStrategy: value as AdvancedTrainingSettings["validationStrategy"],
                    })
                  }
                  options={[
                    { value: "kfold", label: "K-Fold" },
                    { value: "shuffle_split", label: "Shuffle Split" },
                  ]}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Feature engineering</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={advanced.features.scaleFeatures}
                    onChange={(e) => updateFeatures({ scaleFeatures: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm font-medium text-foreground">Scale features</span>
                </label>
                <div className={advanced.features.scaleFeatures ? "" : "pointer-events-none opacity-50"}>
                  <FieldSelect
                    label="Feature scaling method"
                    value={advanced.features.scalerType}
                    onChange={(value) =>
                      updateFeatures({
                        scalerType: value as FeatureEngineeringSettings["scalerType"],
                      })
                    }
                    options={[
                      { value: "standard", label: "StandardScaler" },
                      { value: "minmax", label: "MinMaxScaler" },
                      { value: "robust", label: "RobustScaler" },
                    ]}
                  />
                </div>
                <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={advanced.features.autoRemoveLowImportance}
                    onChange={(e) =>
                      updateFeatures({ autoRemoveLowImportance: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Auto-remove low importance features
                  </span>
                </label>
              </div>
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
