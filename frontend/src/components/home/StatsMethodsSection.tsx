"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Reveal from "@/components/motion/Reveal";
import Stagger from "@/components/motion/Stagger";
import StaggerItem from "@/components/motion/StaggerItem";
import { getCalculatorHref, HOME_METHOD_LINKS } from "@/lib/calculatorLinks";
import { springSoft } from "@/lib/motion";

export default function StatsMethodsSection() {
  return (
    <section className="bg-surface-muted py-16 lg:py-20">
      <Container>
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Many more statistical methods...
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Click any method to open it in the calculator.
          </p>
          <Link
            href="/calculator"
            className="btn-motion mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            Browse all 41+ tests
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Reveal>

        <Stagger fast className="flex flex-wrap justify-center gap-2.5">
          {HOME_METHOD_LINKS.map((method) => (
            <StaggerItem key={method.testId}>
              <motion.div whileHover={{ y: -3, scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={springSoft}>
                <Link
                  href={getCalculatorHref(method.testId)}
                  className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary-light hover:text-primary"
                >
                  {method.label}
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
