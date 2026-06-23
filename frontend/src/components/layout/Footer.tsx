"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";
import Reveal from "@/components/motion/Reveal";
import Stagger from "@/components/motion/Stagger";
import StaggerItem from "@/components/motion/StaggerItem";
import { SITE } from "@/lib/site";
import PageNavigation from "./PageNavigation";

const footerLinks = {
  Product: [
    { label: "Home", href: "/" },
    { label: "Statistics Calculator", href: "/calculator" },
    { label: "Blogs", href: "/blogs" },
  ],
  Help: [
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
  ],
};

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
    >
      <span
        className="h-px w-0 bg-primary transition-all duration-200 group-hover:w-2.5"
        aria-hidden
      />
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <>
      <PageNavigation />
      <footer className="relative shrink-0 overflow-hidden border-t border-slate-800/80 bg-footer-bg text-slate-300">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[min(100%,36rem)] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />

      <Container className="relative">
        <div className="border-b border-slate-800/80 py-10 sm:py-12">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-white">Ready to run your analysis?</p>
              <p className="mt-1 max-w-md text-sm text-slate-400">
                Paste your data, pick a test, and get research-grade results in seconds.
              </p>
            </div>
            <Link
              href="/calculator"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-dark"
            >
              Open calculator
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Reveal>
        </div>

        <div className="py-12 sm:py-14">
          <Stagger className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <StaggerItem className="lg:col-span-5">
              <Logo variant="light" />
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
                Professional statistical analysis in your browser. No installation, no
                uploads — just clear, actionable results.
              </p>

              <a
                href={`mailto:${SITE.contactEmail}`}
                className="mt-6 inline-flex items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/70 hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                {SITE.contactEmail}
              </a>
            </StaggerItem>

            <StaggerItem className="lg:col-span-7">
              <div className="grid gap-8 sm:grid-cols-3">
                {Object.entries(footerLinks).map(([title, links]) => (
                  <div key={title}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {title}
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {links.map((link) => (
                        <li key={link.label}>
                          <FooterLink href={link.href} label={link.label} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </StaggerItem>
          </Stagger>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 py-6 sm:flex-row">
          <p className="text-center text-sm text-slate-500 sm:text-left">
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/privacy"
              className="text-slate-500 transition-colors hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-slate-500 transition-colors hover:text-white"
            >
              Terms
            </Link>
            <Link
              href="/admin"
              className="text-slate-500 transition-colors hover:text-white"
            >
              Admin
            </Link>
          </div>
        </div>
      </Container>
      </footer>
    </>
  );
}
