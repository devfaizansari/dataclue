"use client";

type ConfusionMatrixProps = {
  labels: string[];
  matrix: number[][];
};

export default function ConfusionMatrixChart({ labels, matrix }: ConfusionMatrixProps) {
  const maxValue = Math.max(...matrix.flat(), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Confusion Matrix</h3>
      <p className="mb-4 text-xs text-muted">Actual vs predicted class counts on the evaluation set.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-border px-3 py-2 text-left text-xs font-medium text-muted">
                Actual \\ Predicted
              </th>
              {labels.map((label) => (
                <th
                  key={label}
                  className="border border-border px-3 py-2 text-center text-xs font-medium text-muted"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={labels[rowIndex] ?? rowIndex}>
                <th className="border border-border px-3 py-2 text-left text-xs font-medium text-muted">
                  {labels[rowIndex] ?? rowIndex}
                </th>
                {row.map((value, colIndex) => {
                  const intensity = value / maxValue;
                  return (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className="border border-border px-3 py-2 text-center font-medium text-foreground"
                      style={{
                        backgroundColor: `color-mix(in srgb, var(--color-primary) ${Math.round(intensity * 35)}%, transparent)`,
                      }}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
