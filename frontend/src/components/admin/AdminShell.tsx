"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "@/lib/blogApi";
import Logo from "@/components/ui/Logo";
import PageMotion from "@/components/motion/PageMotion";

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
  showCreateButton?: boolean;
};

const navItems = [
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/settings", label: "Account" },
];

export default function AdminShell({
  children,
  title,
  showCreateButton = true,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    adminLogout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden text-sm font-medium text-muted sm:inline">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/blogs"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {showCreateButton && (
            <Link
              href="/admin/blogs/new"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              New blog post
            </Link>
          )}
        </div>
        <PageMotion>{children}</PageMotion>
      </main>
    </div>
  );
}
