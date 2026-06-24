import type { MetadataRoute } from "next";
import { fetchPublishedBlogsServer } from "@/lib/blogApi";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

const staticRoutes: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/calculator", changeFrequency: "weekly", priority: 0.9 },
  { path: "/blogs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  let blogs: Awaited<ReturnType<typeof fetchPublishedBlogsServer>> = [];
  try {
    blogs = await fetchPublishedBlogsServer();
  } catch {
    blogs = [];
  }

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(
    ({ path, changeFrequency, priority }) => ({
      url: path === "/" ? base : absoluteUrl(path),
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: absoluteUrl(`/blogs/${blog.slug}`),
    lastModified: new Date(blog.createdAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
