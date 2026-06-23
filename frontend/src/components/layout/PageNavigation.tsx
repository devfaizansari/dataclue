"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import { getBackLink } from "@/lib/siteNavigation";

const navButtonClassName =
  "inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary-light/50 dark:hover:bg-primary/10";

export default function PageNavigation() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const back = getBackLink(pathname);

  if (!back) {
    return null;
  }

  return (
    <nav
      aria-label="Page navigation"
      className="mt-auto border-t border-border bg-surface-muted"
    >
      <Container className="flex items-center py-4">
        <Link href={back.href} className={navButtonClassName}>
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>
            <span className="text-muted">Back:</span> {back.label}
          </span>
        </Link>
      </Container>
    </nav>
  );
}
