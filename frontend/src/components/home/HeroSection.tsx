"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Container from "@/components/ui/Container";
import { EASE_OUT, heroItem, heroStagger } from "@/lib/motion";

const trustItems = [
  {
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: "No installation",
  },
  {
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    text: "No cloud upload",
  },
  {
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
      </svg>
    ),
    text: "100% browser-based",
  },
];

export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative -mt-16 overflow-hidden bg-gradient-to-b from-primary-light/40 via-background to-background pt-28 pb-14 transition-colors sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-24 dark:from-background dark:via-background dark:to-background">
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[480px] w-[720px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-400/10 blur-3xl animate-float dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/2 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/2 rounded-full bg-indigo-300/10 blur-3xl animate-float-delayed dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 -translate-x-1/4 translate-y-1/4 rounded-full bg-sky-200/20 blur-3xl animate-float-slow dark:hidden"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute top-0 left-1/2 hidden h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/20 blur-[100px] animate-pulse-glow dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 right-1/4 hidden h-48 w-48 rounded-full bg-blue-500/10 blur-3xl animate-float dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 hidden h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl animate-float-delayed dark:block"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_30%,transparent_100%)] dark:hidden"
        aria-hidden
      />

      <Container className="relative">
        <motion.div
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={heroStagger}
        >
          <motion.span
            variants={heroItem}
            className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary shadow-sm dark:border-primary/30 dark:bg-primary/10 dark:text-blue-300 dark:shadow-none"
          >
            Online Statistical Calculators
          </motion.span>

          <motion.h1
            variants={heroItem}
            className="mt-5 text-4xl leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]"
          >
            <span className="block font-black">Statistical Analysis,</span>
            <span className="mt-1 block font-semibold text-primary dark:text-blue-400">
              Made Simple
            </span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mx-auto mt-4 max-w-[620px] text-base leading-relaxed text-muted sm:text-lg"
          >
            Save hours of manual coding. Perform professional statistical tests
            directly in your browser and get research-grade results instantly
            formatted for your thesis.
          </motion.p>

          <motion.div
            variants={heroItem}
            className="mt-6 flex w-full flex-col gap-3 px-2 sm:w-auto sm:flex-row sm:items-center sm:justify-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ ease: EASE_OUT }}>
              <Link
                href="/calculator"
                className="btn-motion inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/25 dark:shadow-primary/30"
              >
                Start now — it&apos;s free
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ ease: EASE_OUT }}>
              <Link
                href="/blogs"
                className="btn-motion inline-flex items-center justify-center rounded-xl border border-slate-200 bg-surface px-7 py-3.5 text-sm font-semibold text-foreground shadow-sm hover:border-slate-300 hover:bg-surface-muted dark:border-border dark:bg-surface-muted/50 dark:hover:border-primary/40 dark:hover:bg-surface"
              >
                Read Blogs
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            variants={heroItem}
            className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
          >
            {trustItems.map((item, index) => (
              <motion.div
                key={item.text}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.08, duration: 0.4, ease: EASE_OUT }}
                whileHover={{ y: -2 }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-surface-muted/80 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur-sm dark:border-border dark:bg-surface/60 sm:text-sm"
              >
                <span className="text-primary dark:text-blue-400">{item.icon}</span>
                {item.text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
