import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StaticPageShell from "@/components/pages/StaticPageShell";
import PageHeader from "@/components/pages/PageHeader";
import FaqContent from "@/components/faq/FaqContent";
import JsonLd from "@/components/seo/JsonLd";
import { createPageMetadata, faqPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about dataclue — data privacy, supported tests, data formats, and APA-style results.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <StaticPageShell>
      <JsonLd data={faqPageJsonLd()} />
      <PageHeader
        title="Frequently Asked Questions"
        description="Quick answers to common questions about dataclue."
      />
      <section className="py-12 sm:py-16">
        <Container>
          <FaqContent />
          <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-muted">
            Still have questions?{" "}
            <Link href="/contact" className="font-medium text-primary hover:text-primary-dark">
              Contact us
            </Link>
            .
          </p>
        </Container>
      </section>
    </StaticPageShell>
  );
}
