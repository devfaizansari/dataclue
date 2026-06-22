"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import MotionCard from "@/components/motion/MotionCard";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
};

export default function FeatureCard({
  icon,
  title,
  description,
  href = "#",
}: FeatureCardProps) {
  return (
    <MotionCard className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-colors hover:border-primary/20 hover:shadow-lg">
      <motion.div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary"
        whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
        transition={{ duration: 0.45 }}
      >
        {icon}
      </motion.div>
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted">
        {description}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
      >
        Try it now
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </MotionCard>
  );
}
