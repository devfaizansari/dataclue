import type { Metadata } from "next";
import AdminSettings from "@/components/admin/AdminSettings";

export const metadata: Metadata = {
  title: "Admin Settings — dataclue",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return <AdminSettings />;
}
