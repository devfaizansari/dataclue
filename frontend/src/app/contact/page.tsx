import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import StaticPageShell from "@/components/pages/StaticPageShell";
import PageHeader from "@/components/pages/PageHeader";
import ContactContent from "@/components/contact/ContactContent";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description: "Get in touch with the dataclue team for support, feedback, or partnerships.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <StaticPageShell>
      <PageHeader
        title="Contact"
        description="Questions, feedback, or support — we're here to help."
      />
      <section className="py-12 sm:py-16">
        <Container>
          <ContactContent />
        </Container>
      </section>
    </StaticPageShell>
  );
}
