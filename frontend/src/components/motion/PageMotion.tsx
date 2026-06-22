"use client";

import { motion, useReducedMotion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

type PageMotionProps = {
  children: React.ReactNode;
  className?: string;
};

export default function PageMotion({ children, className }: PageMotionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={pageEnter}
    >
      {children}
    </motion.div>
  );
}
