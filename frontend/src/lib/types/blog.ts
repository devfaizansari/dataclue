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
  date: string;
  readTime: string;
  content: BlogContentBlock[];
  published?: boolean;
};

export type BlogListResponse = {
  blogs: BlogPost[];
  count: number;
};

export function formatBlogDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

export function estimateReadTime(content: BlogContentBlock[]): string {
  const words = content.reduce((total, block) => {
    if (block.type === "list") {
      return total + block.items.join(" ").split(/\s+/).length;
    }
    return total + block.text.split(/\s+/).length;
  }, 0);
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
