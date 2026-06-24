"use client";

import { absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { resolveBlogSeo, type BlogPost } from "@/lib/types/blog";

type BlogSeoFieldsProps = {
  form: Pick<
    BlogPost,
    "title" | "excerpt" | "slug" | "seoTitle" | "seoDescription" | "seoKeywords" | "ogImage"
  >;
  onChange: <K extends "seoTitle" | "seoDescription" | "seoKeywords" | "ogImage">(
    key: K,
    value: BlogPost[K],
  ) => void;
};

function CharCount({ value, max, recommended }: { value: string; max: number; recommended?: number }) {
  const length = value.length;
  const tone =
    recommended && length > recommended
      ? "text-amber-600 dark:text-amber-400"
      : length > max
        ? "text-red-600 dark:text-red-400"
        : "text-muted";

  return (
    <span className={`text-xs ${tone}`}>
      {length}/{max}
      {recommended ? ` (recommended ≤${recommended})` : ""}
    </span>
  );
}

export default function BlogSeoFields({ form, onChange }: BlogSeoFieldsProps) {
  const preview = resolveBlogSeo({
    ...form,
    category: "",
    author: "",
    createdAt: new Date().toISOString(),
    content: [],
  });

  const previewUrl = absoluteUrl(`/blogs/${form.slug || "your-post-slug"}`);

  return (
    <div className="space-y-5 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">SEO settings</h2>
        <p className="mt-1 text-sm text-muted">
          Optional fields for search engines and social sharing. Leave blank to use the post title
          and excerpt.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-foreground">Meta title</label>
            <CharCount value={form.seoTitle ?? ""} max={70} recommended={60} />
          </div>
          <input
            value={form.seoTitle ?? ""}
            onChange={(e) => onChange("seoTitle", e.target.value)}
            placeholder={form.title || "Uses post title if empty"}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-foreground">Meta description</label>
            <CharCount value={form.seoDescription ?? ""} max={320} recommended={160} />
          </div>
          <textarea
            value={form.seoDescription ?? ""}
            onChange={(e) => onChange("seoDescription", e.target.value)}
            placeholder={form.excerpt || "Uses excerpt if empty"}
            rows={3}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Keywords
          </label>
          <input
            value={form.seoKeywords ?? ""}
            onChange={(e) => onChange("seoKeywords", e.target.value)}
            placeholder="t-test, hypothesis testing, statistics"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-muted">Comma-separated keywords for search metadata.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Social share image URL
          </label>
          <input
            value={form.ogImage ?? ""}
            onChange={(e) => onChange("ogImage", e.target.value)}
            placeholder="/brand/dataclue-logo.png"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-muted">
            Optional image for Open Graph / Twitter cards. Use a path like /brand/image.png or a
            full URL.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-muted/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Search preview</p>
        <p className="mt-3 text-lg text-[#1a0dab] dark:text-blue-400">
          {preview.title} — {SITE.name}
        </p>
        <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">{previewUrl}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{preview.description}</p>
      </div>
    </div>
  );
}
