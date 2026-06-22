import type { Metadata } from "next";
import AdminBlogForm from "@/components/admin/AdminBlogForm";

export const metadata: Metadata = {
  title: "New Blog — dataclue Admin",
  robots: { index: false, follow: false },
};

export default function AdminNewBlogPage() {
  return <AdminBlogForm />;
}
