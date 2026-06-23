import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsMethodsSection from "@/components/home/StatsMethodsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import AboutSection from "@/components/home/AboutSection";
import PageMotion from "@/components/motion/PageMotion";
import JsonLd from "@/components/seo/JsonLd";
import { createPageMetadata, webApplicationJsonLd } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Statistical Analysis, Made Simple",
  description:
    "Save hours of manual coding. Run professional statistical tests in your browser and get research-grade results instantly.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd data={webApplicationJsonLd()} />
      <Header />
      <PageMotion className="flex-1">
        <main>
          <HeroSection />
          <FeaturesSection />
          <StatsMethodsSection />
          <TestimonialsSection />
          <AboutSection />
        </main>
      </PageMotion>
      <Footer />
    </>
  );
}
