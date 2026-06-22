"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { defaultViewport, EASE_OUT, fadeUp } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  as?: "div" | "section" | "article" | "span";
};

export default function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.55,
  as = "div",
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={fadeUp}
      transition={{ duration, delay, ease: EASE_OUT }}
    >
      {children}
    </Component>
  );
}
