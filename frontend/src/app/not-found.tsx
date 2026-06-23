import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Page Not Found",
  description: "The page you are looking for does not exist or may have been moved.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] flex-1 items-center bg-surface-muted py-16">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              404
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Page not found
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              The page you&apos;re looking for doesn&apos;t exist or may have been moved.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Go to home
              </Link>
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
              >
                Open calculator
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
