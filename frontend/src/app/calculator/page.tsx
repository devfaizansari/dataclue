import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CalculatorTitle from "@/components/calculator/CalculatorTitle";
import CalculatorWorkspace from "@/components/calculator/CalculatorWorkspace";

export const metadata: Metadata = {
  title: "Statistics Calculator — dataclue",
  description:
    "Select a statistical method, enter your data, and get instant results with dataclue.",
};

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
