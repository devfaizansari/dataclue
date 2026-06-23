"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { isAdminLoginPath } from "@/lib/adminNavigation";
import { EASE_OUT, springSnappy } from "@/lib/motion";

function ScrollIcon({ direction }: { direction: "up" | "down" }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      animate={
        reduceMotion
          ? undefined
          : {
              y: direction === "up" ? [0, -3, 0] : [0, 3, 0],
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 1.6,
              repeat: Infinity,
              ease: EASE_OUT,
              repeatDelay: 0.4,
            }
      }
    >
      {direction === "up" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      )}
    </motion.svg>
  );
}

type ScrollActionButtonProps = {
  direction: "up" | "down";
  label: string;
  onClick: () => void;
  delay: number;
  visible: boolean;
};

function ScrollActionButton({
  direction,
  label,
  onClick,
  delay,
  visible,
}: ScrollActionButtonProps) {
  const reduceMotion = useReducedMotion();
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    onClick();
    window.setTimeout(() => setClicked(false), 500);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-surface/95 text-foreground shadow-lg shadow-primary/10 backdrop-blur-md dark:bg-surface/90"
      aria-label={label}
      title={label}
      initial={reduceMotion ? false : { opacity: 0, x: 24, scale: 0.85 }}
      animate={
        visible
          ? { opacity: 1, x: 0, scale: 1 }
          : { opacity: 0, x: 16, scale: 0.9, pointerEvents: "none" as const }
      }
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              scale: 1.08,
              borderColor: "var(--primary)",
              boxShadow: "0 12px 28px -8px rgba(37, 99, 235, 0.45)",
            }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
    >
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full bg-primary/0"
        animate={
          clicked && !reduceMotion
            ? { scale: [1, 1.8], opacity: [0.35, 0] }
            : { scale: 1, opacity: 0 }
        }
        transition={{ duration: 0.5, ease: EASE_OUT }}
        style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        aria-hidden
      />

      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />

      <motion.span
        animate={
          clicked && !reduceMotion
            ? { y: direction === "up" ? -6 : 6, opacity: [1, 0.6, 1] }
            : { y: 0, opacity: 1 }
        }
        transition={springSnappy}
      >
        <ScrollIcon direction={direction} />
      </motion.span>
    </motion.button>
  );
}

export default function ScrollButtons() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(true);

  useEffect(() => {
    const updateVisibility = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setShowUp(scrollTop > 120);
      setShowDown(scrollTop < maxScroll - 120);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [pathname]);

  if (isAdminLoginPath(pathname)) {
    return null;
  }

  const scrollBehavior = reduceMotion ? ("auto" as const) : ("smooth" as const);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: scrollBehavior,
    });
  };

  if (!showUp && !showDown) {
    return null;
  }

  return (
    <motion.div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5"
      aria-label="Scroll page"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      <ScrollActionButton
        direction="up"
        label="Scroll to top"
        onClick={scrollToTop}
        delay={0}
        visible={showUp}
      />
      <ScrollActionButton
        direction="down"
        label="Scroll to bottom"
        onClick={scrollToBottom}
        delay={0.08}
        visible={showDown}
      />
    </motion.div>
  );
}
