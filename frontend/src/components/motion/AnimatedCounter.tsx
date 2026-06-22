"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

type AnimatedCounterProps = {
  value: string;
  className?: string;
};

function parseNumeric(value: string): { prefix: string; number: number; suffix: string } | null {
  const match = value.match(/^([^0-9]*)([\d,]+)(.*)$/);
  if (!match) return null;
  const number = Number(match[2].replace(/,/g, ""));
  if (Number.isNaN(number)) return null;
  return { prefix: match[1], number, suffix: match[3] };
}

function formatCount(
  prefix: string,
  current: number,
  suffix: string,
  target: number,
): string {
  const formatted = target >= 1000 ? current.toLocaleString() : String(current);
  return `${prefix}${formatted}${suffix}`;
}

export default function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const target = parseNumeric(value);
    if (!target) {
      setDisplay(value);
      return;
    }

    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }

    hasAnimated.current = true;
    const { prefix, number, suffix } = target;
    const duration = 1200;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(number * eased);
      setDisplay(formatCount(prefix, current, suffix, number));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [inView, reduceMotion, value]);

  if (reduceMotion || !parsed) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {display}
    </motion.span>
  );
}
