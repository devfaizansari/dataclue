"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { staggerItem } from "@/lib/motion";

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
};

export default function StaggerItem({
  children,
  className,
  as = "div",
}: StaggerItemProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component className={className} variants={staggerItem}>
      {children}
    </Component>
  );
}
