export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

export type BlogPost = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  createdAt: string;
  content: BlogContentBlock[];
  published?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImage?: string | null;
};

export type BlogListResponse = {
  blogs: BlogPost[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BlogListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export const PUBLIC_BLOGS_PAGE_SIZE = 9;
export const ADMIN_BLOGS_PAGE_SIZE = 10;

export function formatBlogDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ResolvedBlogSeo = {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
};

export function resolveBlogSeo(post: BlogPost): ResolvedBlogSeo {
  const keywords =
    post.seoKeywords
      ?.split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean) ?? [];

  return {
    title: post.seoTitle?.trim() || post.title,
    description: post.seoDescription?.trim() || post.excerpt,
    keywords,
    ogImage: post.ogImage?.trim() || undefined,
  };
}
