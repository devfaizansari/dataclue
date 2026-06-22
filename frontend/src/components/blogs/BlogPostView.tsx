import Link from "next/link";
import type { BlogPost } from "@/lib/types/blog";
import { formatBlogDate } from "@/lib/types/blog";
import BlogContent from "./BlogContent";

type BlogPostViewProps = {
  post: BlogPost;
};

export default function BlogPostView({ post }: BlogPostViewProps) {
  return (
    <article>
      <Link
        href="/blogs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to all blogs
      </Link>

      <span className="inline-flex rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
        {post.category}
      </span>

      <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
        {post.title}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-6 text-sm text-muted">
        <span className="font-medium text-foreground">{post.author}</span>
        <span>·</span>
        <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
        <span>·</span>
        <span>{post.readTime}</span>
      </div>

      <div className="mt-8">
        <BlogContent content={post.content} />
      </div>
    </article>
  );
}
