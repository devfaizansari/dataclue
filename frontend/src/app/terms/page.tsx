import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import StaticPageShell from "@/components/pages/StaticPageShell";
import PageHeader from "@/components/pages/PageHeader";
import TermsContent from "@/components/legal/TermsContent";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Use",
  description: "Terms and conditions for using the dataclue statistical analysis platform.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <StaticPageShell>
      <PageHeader
        title="Terms of Use"
        description="Rules and guidelines for using dataclue."
      />
      <section className="py-12 sm:py-16">
        <Container>
          <TermsContent />
        </Container>
      </section>
    </StaticPageShell>
  );
}
