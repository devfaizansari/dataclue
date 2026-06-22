"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { defaultViewport, staggerContainer, staggerContainerFast } from "@/lib/motion";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  fast?: boolean;
  as?: "div" | "ul" | "section";
};

export default function Stagger({
  children,
  className,
  fast = false,
  as = "div",
}: StaggerProps) {
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
      variants={fast ? staggerContainerFast : staggerContainer}
    >
      {children}
    </Component>
  );
}
