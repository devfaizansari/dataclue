"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";
import MobileNavSidebar from "./MobileNavSidebar";

export const navLinks = [
  {
    label: "Statistics Calculator",
    shortLabel: "Calculator",
    href: "/calculator",
  },
  { label: "Blogs", shortLabel: "Blogs", href: "/blogs" },
];

const ctaClassName =
  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark";

function DesktopNavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="group relative inline-flex items-center py-0 text-sm font-medium transition-colors"
    >
      <span
        className={
          isActive
            ? "text-foreground"
            : "text-muted group-hover:text-foreground"
        }
      >
        {label}
      </span>
      <span
        className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary transition-transform duration-200 ${
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
        aria-hidden
      />
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";
  const blendWithHero = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 m-0 mt-0 border-0 pt-0 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
          blendWithHero
            ? "bg-gradient-to-b from-primary-light/40 to-primary-light/0 dark:from-background dark:to-background/0"
            : scrolled
              ? "bg-background/95 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.1)] backdrop-blur-md"
              : "bg-background/90 backdrop-blur-sm"
        }`}
      >
        <Container className={blendWithHero ? "pb-2" : ""}>
          <div className="relative flex h-16 items-center justify-between gap-3">
            <div className="shrink-0">
              <Logo compact />
            </div>

            <nav
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
              aria-label="Main navigation"
            >
              {navLinks.map((link) => (
                <DesktopNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  isActive={pathname.startsWith(link.href)}
                />
              ))}
            </nav>

            <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              <ThemeToggle className="h-9 w-9 rounded-lg lg:h-10 lg:w-10" />

              <div
                className="mx-0.5 hidden h-5 w-px bg-border sm:block"
                aria-hidden
              />

              <Link
                href="/calculator"
                className={`hidden sm:inline-flex ${ctaClassName}`}
              >
                Open calculator
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-muted/80 lg:hidden"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
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
                    d="M4 8h16M4 16h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </header>

      <MobileNavSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks.map(({ label, shortLabel, href }) => ({
          label,
          shortLabel,
          href,
        }))}
      />
    </>
  );
}
