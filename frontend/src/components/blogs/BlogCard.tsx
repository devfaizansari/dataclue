"use client";

import Link from "next/link";
import type { BlogPost } from "@/lib/types/blog";
import { formatBlogDate } from "@/lib/types/blog";
import MotionCard from "@/components/motion/MotionCard";

type BlogCardProps = {
  post: BlogPost;
};

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <MotionCard
      hover
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-sm hover:border-primary/20 hover:shadow-lg"
    >
      <span className="mb-3 inline-flex w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
        {post.category}
      </span>

      <h2 className="mb-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
        <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
      </h2>

      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted">
        {post.excerpt}
      </p>

      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{post.author}</span>
          <span>·</span>
          <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
        </div>
        <span>{post.readTime}</span>
      </div>
    </MotionCard>
  );
}
