import { type ReactNode } from "react";
import ChartContainer from "./ChartContainer";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/50 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted">{description}</p>
      )}
      <ChartContainer>{children}</ChartContainer>
    </div>
  );
}
