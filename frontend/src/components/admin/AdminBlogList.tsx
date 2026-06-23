"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "./AdminShell";
import BlogMessageModal, { type BlogMessageModalState } from "./BlogMessageModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { deleteBlog, fetchAdminBlogs } from "@/lib/blogApi";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { ApiError } from "@/lib/api";
import type { BlogPost } from "@/lib/types/blog";
import { formatBlogDate } from "@/lib/types/blog";

export default function AdminBlogList() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [messageModal, setMessageModal] = useState<BlogMessageModalState>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const loadBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminBlogs();
      setBlogs(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError("Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    loadBlogs();
  }, [router]);

  const closeMessage = () => {
    setMessageModal((current) => ({ ...current, open: false }));
  };

  const confirmDelete = async () => {
    if (!blogToDelete?.id) return;

    setDeleting(true);
    try {
      await deleteBlog(blogToDelete.id);
      setBlogs((current) => current.filter((item) => item.id !== blogToDelete.id));
      setBlogToDelete(null);
      setMessageModal({
        open: true,
        type: "success",
        title: "Blog deleted",
        message: `"${blogToDelete.title}" has been permanently removed.`,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Delete failed. Please try again.";
      setMessageModal({
        open: true,
        type: "error",
        title: "Delete failed",
        message,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminShell title="Blog posts">
        {loading && <p className="text-sm text-muted">Loading blogs…</p>}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
            <p className="text-foreground">No blog posts yet.</p>
            <Link href="/admin/blogs/new" className="mt-3 inline-block text-sm font-semibold text-primary">
              Create your first post
            </Link>
          </div>
        )}

        {!loading && blogs.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Title</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                    Category
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blogs.map((blog) => (
                  <tr key={blog.id ?? blog.slug}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{blog.title}</p>
                      <p className="text-xs text-muted">/{blog.slug}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">{blog.category}</td>
                    <td className="hidden px-4 py-3 text-muted lg:table-cell">
                      {formatBlogDate(blog.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          blog.published
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {blog.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/blogs/${blog.id}/edit`}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setBlogToDelete(blog)}
                          disabled={deleting && blogToDelete?.id === blog.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminShell>

      <DeleteConfirmModal
        open={Boolean(blogToDelete)}
        title="Delete this blog post?"
        itemName={blogToDelete?.title ?? ""}
        loading={deleting}
        onCancel={() => {
          if (!deleting) setBlogToDelete(null);
        }}
        onConfirm={confirmDelete}
      />

      <BlogMessageModal modal={messageModal} onClose={closeMessage} />
    </>
  );
}
