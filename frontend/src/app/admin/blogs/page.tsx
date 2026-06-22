import type { Metadata } from "next";
import AdminBlogList from "@/components/admin/AdminBlogList";

export const metadata: Metadata = {
  title: "Admin Blogs — dataclue",
  robots: { index: false, follow: false },
};

export default function AdminBlogsPage() {
  return <AdminBlogList />;
}
