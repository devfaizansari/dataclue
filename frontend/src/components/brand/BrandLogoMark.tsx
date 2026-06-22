"use client";

import { motion, useReducedMotion } from "framer-motion";
import BrandLogoImage from "./BrandLogoImage";
import { EASE_OUT, springSoft } from "@/lib/motion";

type BrandLogoMarkProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  animate?: boolean;
  priority?: boolean;
};

const sizes = {
  sm: { wrap: "gap-3", text: "text-xl", tag: "text-[10px]" },
  md: { wrap: "gap-4", text: "text-3xl", tag: "text-[11px]" },
  lg: { wrap: "gap-5", text: "text-[2.75rem]", tag: "text-xs" },
};

function Wordmark({ textClass, tagClass }: { textClass: string; tagClass: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`flex items-baseline tracking-tight ${textClass}`}>
        <span className="font-semibold text-muted">data</span>
        <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text font-black text-transparent dark:from-blue-400 dark:to-blue-600">
          clue
        </span>
      </div>
      <span className={`font-semibold tracking-[0.22em] text-muted/80 uppercase ${tagClass}`}>
        Statistics Platform
      </span>
    </div>
  );
}

export default function BrandLogoMark({
  size = "md",
  showText = true,
  animate = true,
  priority = false,
}: BrandLogoMarkProps) {
  const reduceMotion = useReducedMotion();
  const s = sizes[size];
  const shouldAnimate = animate && !reduceMotion;

  const logo = (
    <span className="relative inline-flex">
      {shouldAnimate && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border border-primary/25"
            initial={{ scale: 0.95, opacity: 0.45 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            aria-hidden
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-primary/15"
            initial={{ scale: 0.95, opacity: 0.3 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.55 }}
            aria-hidden
          />
        </>
      )}
      <BrandLogoImage size={size} priority={priority} />
    </span>
  );

  if (!shouldAnimate) {
    return (
      <div className={`flex flex-col items-center ${s.wrap}`}>
        {logo}
        {showText && <Wordmark textClass={s.text} tagClass={s.tag} />}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${s.wrap}`}>
      <motion.div
        initial={{ scale: 0.78, opacity: 0, filter: "blur(10px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ ...springSoft, duration: 0.7 }}
      >
        {logo}
      </motion.div>
      {showText && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.55, ease: EASE_OUT }}
        >
          <Wordmark textClass={s.text} tagClass={s.tag} />
        </motion.div>
      )}
    </div>
  );
}
