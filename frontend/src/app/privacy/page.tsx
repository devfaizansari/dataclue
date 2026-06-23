import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import StaticPageShell from "@/components/pages/StaticPageShell";
import PageHeader from "@/components/pages/PageHeader";
import PrivacyContent from "@/components/legal/PrivacyContent";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "Learn how dataclue collects, uses, and protects your information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <StaticPageShell>
      <PageHeader
        title="Privacy Policy"
        description="How we handle your data and protect your privacy."
      />
      <section className="py-12 sm:py-16">
        <Container>
          <PrivacyContent />
        </Container>
      </section>
    </StaticPageShell>
  );
}
