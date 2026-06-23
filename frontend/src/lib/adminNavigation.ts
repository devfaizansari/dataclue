export type AdminNavPage = {
  href: string;
  label: string;
};

export const ADMIN_NAV_PAGES: AdminNavPage[] = [
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/settings", label: "Account" },
];

export function getAdminBackLink(pathname: string): AdminNavPage | null {
  if (pathname === "/admin/blogs/new") {
    return { href: "/admin/blogs", label: "All Blogs" };
  }

  if (/^\/admin\/blogs\/[^/]+\/edit$/.test(pathname)) {
    return { href: "/admin/blogs", label: "All Blogs" };
  }

  return null;
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/login";
}
