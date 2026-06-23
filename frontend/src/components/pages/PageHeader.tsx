"use client";

import Container from "@/components/ui/Container";
import PageMotion from "@/components/motion/PageMotion";
import Reveal from "@/components/motion/Reveal";

type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <section className="border-b border-border bg-surface py-12 sm:py-16">
      <Container>
        <PageMotion className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                {description}
              </p>
            ) : null}
          </Reveal>
        </PageMotion>
      </Container>
    </section>
  );
}
