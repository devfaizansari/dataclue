"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BrandSplash from "./BrandSplash";
import { EASE_OUT } from "@/lib/motion";

const MIN_SPLASH_MS = 1800;
const REDUCED_SPLASH_MS = 200;

type AppSplashGateProps = {
  children: React.ReactNode;
};

export default function AppSplashGate({ children }: AppSplashGateProps) {
  const reduceMotion = useReducedMotion();
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const minMs = reduceMotion ? REDUCED_SPLASH_MS : MIN_SPLASH_MS;
    const started = performance.now();

    const finish = () => {
      const elapsed = performance.now() - started;
      const remaining = Math.max(0, minMs - elapsed);
      window.setTimeout(() => {
        setShowSplash(false);
        setReady(true);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      return () => window.removeEventListener("load", finish);
    }
  }, [reduceMotion]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <BrandSplash key="app-splash" mode="intro" />}
      </AnimatePresence>
      <motion.div
        className="flex min-h-full flex-1 flex-col"
        initial={false}
        animate={{
          opacity: ready ? 1 : 0,
        }}
        transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: EASE_OUT }}
        aria-hidden={showSplash}
      >
        {children}
      </motion.div>
    </>
  );
}
