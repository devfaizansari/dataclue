import type { Metadata } from "next";
import AdminBlogForm from "@/components/admin/AdminBlogForm";

export const metadata: Metadata = {
  title: "Edit Blog — dataclue Admin",
  robots: { index: false, follow: false },
};

type EditBlogPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params;
  return <AdminBlogForm blogId={id} />;
}
