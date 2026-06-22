"use client";

import { useEffect, useState, type ReactNode } from "react";

type ChartContainerProps = {
  children: ReactNode;
};

export default function ChartContainer({ children }: ChartContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="mt-4 h-72 min-h-[288px] w-full min-w-0">
      {mounted ? (
        children
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg bg-slate-100/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
