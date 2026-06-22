"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "./AdminShell";
import { createBlog, fetchAdminBlogById, updateBlog } from "@/lib/blogApi";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { ApiError } from "@/lib/api";
import type { BlogContentBlock, BlogPost } from "@/lib/types/blog";
import { estimateReadTime, slugifyTitle } from "@/lib/types/blog";

type AdminBlogFormProps = {
  blogId?: string;
};

const emptyBlock = (): BlogContentBlock => ({ type: "paragraph", text: "" });

const defaultForm: Omit<BlogPost, "id"> = {
  slug: "",
  title: "",
  excerpt: "",
  category: "Research Tips",
  author: "dataclue Team",
  date: new Date().toISOString().slice(0, 10),
  readTime: "5 min read",
  content: [emptyBlock()],
  published: true,
};

export default function AdminBlogForm({ blogId }: AdminBlogFormProps) {
  const router = useRouter();
  const isEdit = Boolean(blogId);
  const [form, setForm] = useState<Omit<BlogPost, "id">>(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
      return;
    }

    if (!blogId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const blog = await fetchAdminBlogById(blogId!);
        setForm({
          slug: blog.slug,
          title: blog.title,
          excerpt: blog.excerpt,
          category: blog.category,
          author: blog.author,
          date: blog.date,
          readTime: blog.readTime,
          content: blog.content.length > 0 ? blog.content : [emptyBlock()],
          published: blog.published ?? true,
        });
        setSlugTouched(true);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError("Failed to load blog post.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [blogId, router]);

  const updateField = <K extends keyof Omit<BlogPost, "id">>(
    key: K,
    value: Omit<BlogPost, "id">[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      slug: slugTouched ? current.slug : slugifyTitle(title),
      readTime: estimateReadTime(current.content),
    }));
  };

  const updateBlock = (index: number, block: BlogContentBlock) => {
    setForm((current) => {
      const content = [...current.content];
      content[index] = block;
      return {
        ...current,
        content,
        readTime: estimateReadTime(content),
      };
    });
  };

  const addBlock = (type: BlogContentBlock["type"]) => {
    setForm((current) => {
      const nextBlock: BlogContentBlock =
        type === "list" ? { type: "list", items: [""] } : { type, text: "" };
      const content = [...current.content, nextBlock];
      return { ...current, content, readTime: estimateReadTime(content) };
    });
  };

  const removeBlock = (index: number) => {
    setForm((current) => {
      const content = current.content.filter((_, i) => i !== index);
      return {
        ...current,
        content: content.length > 0 ? content : [emptyBlock()],
        readTime: estimateReadTime(content),
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      slug: form.slug.trim().toLowerCase(),
      content: form.content.filter((block) => {
        if (block.type === "list") {
          return block.items.some((item) => item.trim());
        }
        return block.text?.trim();
      }),
      readTime: estimateReadTime(form.content),
    };

    if (payload.content.length === 0) {
      setError("Add at least one content block.");
      setSaving(false);
      return;
    }

    try {
      if (isEdit && blogId) {
        await updateBlog(blogId, payload);
      } else {
        await createBlog(payload);
      }
      router.push("/admin/blogs");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Save failed.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title={isEdit ? "Edit blog post" : "New blog post"} showCreateButton={false}>
        <p className="text-sm text-muted">Loading…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={isEdit ? "Edit blog post" : "New blog post"} showCreateButton={false}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
            <input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                updateField("slug", e.target.value);
              }}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
            <input
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Author</label>
            <input
              value={form.author}
              onChange={(e) => updateField("author", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={form.published ?? true}
                onChange={(e) => updateField("published", e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              Published (visible on public blogs page)
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Content blocks</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addBlock("paragraph")}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
              >
                + Paragraph
              </button>
              <button
                type="button"
                onClick={() => addBlock("heading")}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
              >
                + Heading
              </button>
              <button
                type="button"
                onClick={() => addBlock("list")}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
              >
                + List
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {form.content.map((block, index) => (
              <div key={index} className="rounded-lg border border-border bg-surface-muted/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {block.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                {block.type === "list" ? (
                  <div className="space-y-2">
                    {block.items.map((item, itemIndex) => (
                      <input
                        key={itemIndex}
                        value={item}
                        onChange={(e) => {
                          const items = [...block.items];
                          items[itemIndex] = e.target.value;
                          updateBlock(index, { type: "list", items });
                        }}
                        placeholder={`List item ${itemIndex + 1}`}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(index, {
                          type: "list",
                          items: [...block.items, ""],
                        })
                      }
                      className="text-xs font-medium text-primary"
                    >
                      + Add list item
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={block.text}
                    onChange={(e) =>
                      updateBlock(index, { type: block.type, text: e.target.value })
                    }
                    rows={block.type === "heading" ? 2 : 4}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    placeholder={block.type === "heading" ? "Heading text" : "Paragraph text"}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Update blog" : "Create blog"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/blogs")}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
