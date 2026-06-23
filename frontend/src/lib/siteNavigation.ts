export type SiteNavPage = {
  href: string;
  label: string;
};

export const SITE_NAV_PAGES: SiteNavPage[] = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Statistics Calculator" },
  { href: "/blogs", label: "Blogs" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
];

function isKnownPublicPath(pathname: string): boolean {
  return (
    SITE_NAV_PAGES.some((page) => page.href === pathname) || pathname === "/blogs"
  );
}

/** Back link only where a clear parent page exists (not on blog posts — they have their own back link). */
export function getBackLink(pathname: string): SiteNavPage | null {
  if (!pathname.startsWith("/admin") && !isKnownPublicPath(pathname)) {
    return { href: "/", label: "Home" };
  }

  return null;
}
