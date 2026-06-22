import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import BlogsListing from "@/components/blogs/BlogsListing";
import BlogsPageHeader from "@/components/blogs/BlogsPageHeader";

export const metadata: Metadata = {
  title: "Blogs — dataclue",
  description:
    "Statistical analysis guides, research tips, and tutorials from the dataclue team.",
};

export default function BlogsPage() {
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1 overflow-x-hidden bg-surface-muted">
        <BlogsPageHeader />

        <section className="py-12 sm:py-16">
          <Container>
            <BlogsListing />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
