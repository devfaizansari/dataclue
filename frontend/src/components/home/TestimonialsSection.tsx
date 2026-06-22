"use client";

import Container from "@/components/ui/Container";
import TestimonialCard from "./TestimonialCard";
import Reveal from "@/components/motion/Reveal";
import Stagger from "@/components/motion/Stagger";
import StaggerItem from "@/components/motion/StaggerItem";

const testimonials = [
  {
    quote:
      "dataclue replaced SPSS for my graduate research. The interface is intuitive and results are publication-ready.",
    name: "Dr. Sarah M.",
    role: "Research Psychologist, University of Munich",
  },
  {
    quote:
      "I use dataclue daily for quick statistical checks. No more waiting for software licenses or IT support.",
    name: "James K.",
    role: "Data Analyst, Healthcare Startup",
  },
  {
    quote:
      "Perfect for teaching statistics. Students can focus on interpretation instead of struggling with software.",
    name: "Prof. Elena R.",
    role: "Statistics Lecturer, ETH Zurich",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <Reveal className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            What our users say
          </h2>
        </Reveal>

        <Stagger className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <StaggerItem key={testimonial.name}>
              <TestimonialCard {...testimonial} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
