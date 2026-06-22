import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsMethodsSection from "@/components/home/StatsMethodsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import AboutSection from "@/components/home/AboutSection";
import PageMotion from "@/components/motion/PageMotion";

export default function Home() {
  return (
    <>
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
