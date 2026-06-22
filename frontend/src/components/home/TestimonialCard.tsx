"use client";

import MotionCard from "@/components/motion/MotionCard";

type TestimonialCardProps = {
  quote: string;
  name: string;
  role: string;
};

function StarRating() {
  return (
    <div className="mb-4 flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="h-4 w-4 text-amber-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialCard({
  quote,
  name,
  role,
}: TestimonialCardProps) {
  return (
    <MotionCard className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-sm hover:shadow-md">
      <StarRating />
      <blockquote className="mb-5 flex-1 text-sm leading-relaxed text-muted italic">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted">{role}</p>
      </div>
    </MotionCard>
  );
}
