import { type ReactNode } from "react";

type ProseProps = {
  children: ReactNode;
  className?: string;
};

export default function Prose({ children, className = "" }: ProseProps) {
  return (
    <div
      className={`prose-content mx-auto max-w-3xl text-foreground ${className}`}
    >
      {children}
    </div>
  );
}
