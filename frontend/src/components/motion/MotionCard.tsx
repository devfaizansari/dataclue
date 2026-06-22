"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cardHover, springSoft } from "@/lib/motion";

type MotionCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export default function MotionCard({
  children,
  className,
  hover = true,
}: MotionCardProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={hover ? cardHover : undefined}
      whileTap={hover ? { scale: 0.995 } : undefined}
      transition={springSoft}
    >
      {children}
    </motion.div>
  );
}
