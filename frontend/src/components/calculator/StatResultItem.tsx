type StatResultItemProps = {
  label: string;
  value: string;
  badge?: {
    text: string;
    variant: "success" | "warning" | "info" | "neutral";
  };
};

const badgeStyles = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function StatResultItem({
  label,
  value,
  badge,
}: StatResultItemProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/80 px-4 py-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-xl font-bold text-foreground">{value}</p>
        {badge && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles[badge.variant]}`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
