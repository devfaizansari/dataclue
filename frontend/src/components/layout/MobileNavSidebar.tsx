"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { EASE_OUT } from "@/lib/motion";

type NavLink = {
  label: string;
  shortLabel?: string;
  href: string;
};

type MobileNavSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
};

export default function MobileNavSidebar({
  isOpen,
  onClose,
  navLinks,
}: MobileNavSidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />

          <motion.aside
            className="fixed top-0 right-0 z-50 flex h-full w-[min(100%,300px)] flex-col bg-background shadow-xl lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo compact />
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-3 py-4" aria-label="Mobile menu">
              <ul className="space-y-0.5">
                {navLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        aria-current={isActive ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                          isActive
                            ? "bg-surface-muted text-foreground"
                            : "text-muted hover:bg-surface-muted hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="space-y-3 border-t border-border p-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted">Theme</span>
                <ThemeToggle />
              </div>
              <Link
                href="/calculator"
                onClick={onClose}
                className="block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Open calculator
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
