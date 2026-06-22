import { type ReactNode } from "react";

type ChartResultsCardProps = {
  title: string;
  children: ReactNode;
};

export default function ChartResultsCard({
  title,
  children,
}: ChartResultsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-foreground">
          Results — {title}
        </h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}
