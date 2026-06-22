"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import AnimatedCounter from "@/components/motion/AnimatedCounter";
import Reveal from "@/components/motion/Reveal";
import Stagger from "@/components/motion/Stagger";
import StaggerItem from "@/components/motion/StaggerItem";

const highlights = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Privacy first",
    description: "Your data never leaves your browser. No uploads, no cloud storage.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: "Research-grade output",
    description: "APA-formatted results ready for papers, theses, and publications.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Instant analysis",
    description: "Paste data, pick a test, and get results in seconds — no coding required.",
  },
];

const stats = [
  { value: "50+", label: "Statistical tests" },
  { value: "50K+", label: "Researchers" },
  { value: "0", label: "Data uploaded" },
  { value: "100%", label: "Browser-based" },
];

export default function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark py-20 transition-colors lg:py-28 dark:from-slate-900 dark:via-slate-900 dark:to-footer-bg">
      <div
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-float dark:bg-primary/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-float-slow dark:bg-blue-600/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]"
        aria-hidden
      />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-100 backdrop-blur-sm dark:border-primary/30 dark:bg-primary/10 dark:text-blue-300">
              About dataclue
            </span>

            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.5rem] dark:text-foreground">
              Making statistics accessible to every researcher
            </h2>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-blue-100/90 dark:text-muted">
              dataclue was built by researchers, for researchers. We believe
              statistical analysis should be open to everyone — without
              expensive licenses or steep learning curves.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-blue-100/80 dark:text-muted/90">
              Our mission is to democratize data analysis with professional
              tools that run entirely in your browser, keeping your work private
              and secure.
            </p>

            <div className="mt-8">
              <Link
                href="/calculator"
                className="btn-motion inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary shadow-lg shadow-blue-900/20 hover:bg-blue-50 hover:shadow-xl dark:bg-primary dark:text-white dark:shadow-primary/20 dark:hover:bg-primary-dark"
              >
                Start for free
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-blue-900/20 backdrop-blur-md sm:p-8 dark:border-border dark:bg-surface dark:shadow-none dark:backdrop-blur-none">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-blue-200 dark:text-primary">
              Why researchers choose dataclue
            </h3>

            <Stagger className="space-y-5">
              {highlights.map((item) => (
                <StaggerItem key={item.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white dark:bg-primary/15 dark:text-primary">
                    {item.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-white dark:text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-blue-100/80 dark:text-muted">
                      {item.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Stagger fast className="mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-8 sm:grid-cols-4 dark:border-border">
              {stats.map((stat) => (
                <StaggerItem key={stat.label} className="text-center sm:text-left">
                  <AnimatedCounter
                    value={stat.value}
                    className="text-xl font-bold text-white sm:text-2xl dark:text-foreground"
                  />
                  <p className="mt-0.5 text-xs text-blue-200 dark:text-muted">
                    {stat.label}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
