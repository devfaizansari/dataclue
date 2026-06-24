"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import BlogCard from "./BlogCard";
import Stagger from "@/components/motion/Stagger";
import StaggerItem from "@/components/motion/StaggerItem";
import Pagination from "@/components/ui/Pagination";
import { fetchPublishedBlogs } from "@/lib/blogApi";
import type { BlogPost } from "@/lib/types/blog";
import { PUBLIC_BLOGS_PAGE_SIZE } from "@/lib/types/blog";
import { fadeUp, EASE_OUT } from "@/lib/motion";

export default function BlogsListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const searchFromUrl = searchParams.get("search") ?? "";

  const [search, setSearch] = useState(searchFromUrl);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearch(searchFromUrl);
    setPage(pageFromUrl);
  }, [pageFromUrl, searchFromUrl]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPublishedBlogs({
          page,
          pageSize: PUBLIC_BLOGS_PAGE_SIZE,
          search: searchFromUrl || undefined,
        });
        if (!active) return;
        setPosts(data.blogs);
        setTotalPages(data.totalPages);
        setTotalCount(data.count);
      } catch {
        if (active) {
          setError("Could not load blogs. Is the backend and MongoDB running?");
          setPosts([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [page, searchFromUrl]);

  const updateQuery = (nextPage: number, nextSearch: string) => {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    const query = params.toString();
    router.replace(query ? `/blogs?${query}` : "/blogs", { scroll: false });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQuery(1, search);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    updateQuery(nextPage, searchFromUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <form onSubmit={handleSearchSubmit} className="relative mx-auto max-w-xl">
        <svg
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder="Search blogs by title, topic, or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </form>

      {!loading && !error && totalCount > 0 && (
        <p className="mt-4 text-center text-sm text-muted">
          Showing {posts.length} of {totalCount} article{totalCount === 1 ? "" : "s"}
          {searchFromUrl ? ` for "${searchFromUrl}"` : ""}
        </p>
      )}

      {loading && (
        <motion.div
          className="mt-16 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted">Loading blogs…</p>
        </motion.div>
      )}

      {error && (
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <StaggerItem key={post.slug}>
                <BlogCard post={post} />
              </StaggerItem>
            ))}
          </Stagger>

          <Pagination
            className="mt-10"
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {!loading && !error && posts.length === 0 && (
        <motion.div
          className="mt-16 text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <p className="text-lg font-medium text-foreground">No blogs found</p>
          <p className="mt-2 text-sm text-muted">
            {totalCount === 0 && !searchFromUrl
              ? "No published blogs yet. Add one from the admin panel."
              : "Try a different search term or browse all articles."}
          </p>
          {searchFromUrl && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                updateQuery(1, "");
              }}
              className="mt-4 text-sm font-semibold text-primary hover:text-primary-dark"
            >
              Clear search
            </button>
          )}
        </motion.div>
      )}
    </>
  );
}
