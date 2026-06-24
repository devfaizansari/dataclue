import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import BlogsListing from "@/components/blogs/BlogsListing";
import BlogsPageHeader from "@/components/blogs/BlogsPageHeader";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Blogs",
  description:
    "Statistical analysis guides, research tips, and tutorials to help you master data analysis and reporting.",
  path: "/blogs",
});

export default function BlogsPage() {
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1 overflow-x-hidden bg-surface-muted">
        <BlogsPageHeader />

        <section className="py-12 sm:py-16">
          <Container>
            <Suspense
              fallback={
                <div className="py-16 text-center text-sm text-muted">Loading blogs…</div>
              }
            >
              <BlogsListing />
            </Suspense>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
