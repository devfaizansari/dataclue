"use client";

import { motion, useReducedMotion } from "framer-motion";
import BrandLogoMark from "./BrandLogoMark";
import { EASE_OUT } from "@/lib/motion";

export type BrandSplashMode = "intro" | "loading";

type BrandSplashProps = {
  message?: string;
  size?: "sm" | "md" | "lg";
  mode?: BrandSplashMode;
};

function SplashBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-background" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--primary-light)_0%,transparent_55%)] opacity-90 dark:opacity-70"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/4 -left-24 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl animate-float-slow dark:bg-blue-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl animate-float-delayed dark:bg-indigo-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_20%,transparent_100%)] dark:bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        aria-hidden
      />
    </>
  );
}

function SplashProgress({ label }: { label: string }) {
  return (
    <div className="mx-auto mt-10 flex w-full max-w-[220px] flex-col items-center">
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-border/80">
        <motion.div
          className="splash-progress-bar absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-primary/20 via-primary to-primary-dark"
          aria-hidden
        />
      </div>
      <p className="mt-3 w-full text-center text-[11px] font-medium tracking-wide text-muted/90">
        {label}
      </p>
    </div>
  );
}

export default function BrandSplash({
  message,
  size = "lg",
  mode = "intro",
}: BrandSplashProps) {
  const reduceMotion = useReducedMotion();
  const isLoading = mode === "loading";
  const headline = message ?? (isLoading ? "Computing your results" : "Statistical analysis, made simple");
  const progressLabel = isLoading ? "Processing dataset…" : "Preparing workspace…";

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: reduceMotion ? 1 : 1.02,
        filter: reduceMotion ? "none" : "blur(4px)",
      }}
      transition={{ duration: reduceMotion ? 0.12 : 0.55, ease: EASE_OUT }}
      role="status"
      aria-live="polite"
      aria-label={headline}
    >
      <SplashBackdrop />

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center px-8"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <div className="relative flex w-full flex-col items-center rounded-3xl border border-border/60 bg-surface/70 px-10 py-12 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-surface/40 dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.55)]">
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"
            aria-hidden
          />

          <BrandLogoMark size={size} animate priority={mode === "intro"} />

          <motion.p
            className="mx-auto mt-8 max-w-[260px] text-center text-sm leading-relaxed text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38, duration: 0.45 }}
          >
            {headline}
          </motion.p>

          {!reduceMotion && <SplashProgress label={progressLabel} />}
        </div>

        <motion.p
          className="mt-8 text-[10px] font-medium tracking-[0.18em] text-muted/60 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          Browser-native · Private · Research-grade
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
