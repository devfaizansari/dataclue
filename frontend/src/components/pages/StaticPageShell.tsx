import { type ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type StaticPageShellProps = {
  children: ReactNode;
};

export default function StaticPageShell({ children }: StaticPageShellProps) {
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1 overflow-x-hidden bg-surface-muted">{children}</main>
      <Footer />
    </>
  );
}
