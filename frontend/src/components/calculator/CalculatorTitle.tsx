"use client";

import Container from "@/components/ui/Container";
import Reveal from "@/components/motion/Reveal";

export default function CalculatorTitle() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <Container className="py-8">
        <Reveal>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Statistics Calculator
          </h1>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Select a statistical method, enter your data, and get instant results.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
