"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";
import Reveal from "@/components/motion/Reveal";
import Stagger from "@/components/motion/Stagger";
import StaggerItem from "@/components/motion/StaggerItem";

const footerLinks = {
  Help: [
    { label: "Contact", href: "#" },
    { label: "Consulting", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  Software: [
    { label: "vs. Minitab", href: "#" },
    { label: "vs. SPSS", href: "#" },
    { label: "vs. Excel", href: "#" },
  ],
  Convert: [
    { label: "CSV to JSON", href: "#" },
    { label: "Excel to CSV", href: "#" },
    { label: "JSON to CSV", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Use", href: "#" },
    { label: "Data Security", href: "#" },
  ],
};

const languages = ["EN", "DE", "ES", "FR"];

export default function Footer() {
  return (
    <footer className="bg-footer-bg text-slate-300">
      <Container className="py-14">
        <Stagger className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <StaggerItem className="lg:col-span-1">
            <Logo variant="light" />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Professional statistical analysis in your browser. No installation,
              no cloud — just results.
            </p>
          </StaggerItem>

          {Object.entries(footerLinks).map(([title, links]) => (
            <StaggerItem key={title}>
              <h3 className="mb-4 text-sm font-semibold text-white">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:translate-x-0.5 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.2} className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-700 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} dataclue. All rights reserved.
            <Link href="/admin" className="ml-3 text-slate-500 hover:text-white">
              Admin
            </Link>
          </p>
          <div className="flex items-center gap-4">
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                className={`text-sm transition-colors ${
                  lang === "EN"
                    ? "font-semibold text-white"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </Reveal>
      </Container>
    </footer>
  );
}
