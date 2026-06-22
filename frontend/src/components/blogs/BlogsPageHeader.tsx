"use client";

import Container from "@/components/ui/Container";
import PageMotion from "@/components/motion/PageMotion";
import Reveal from "@/components/motion/Reveal";

export default function BlogsPageHeader() {
  return (
    <section className="border-b border-border bg-surface py-12 sm:py-16">
      <Container>
        <PageMotion className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Blogs
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
              Guides, tutorials, and research tips to help you master
              statistical analysis.
            </p>
          </Reveal>
        </PageMotion>
      </Container>
    </section>
  );
}
