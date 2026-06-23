import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CalculatorTitle from "@/components/calculator/CalculatorTitle";
import CalculatorWorkspace from "@/components/calculator/CalculatorWorkspace";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Statistics Calculator",
  description:
    "Free online statistical calculator. Run t-tests, ANOVA, regression, correlation, chi-square, and machine learning models with instant APA-style results.",
  path: "/calculator",
});

export default function CalculatorPage() {
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <CalculatorTitle />
        <Suspense
          fallback={
            <div className="py-16 text-center text-sm text-muted">Loading calculator…</div>
          }
        >
          <CalculatorWorkspace />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
