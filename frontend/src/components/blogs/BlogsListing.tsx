"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BlogCard from "./BlogCard";
import Stagger from "@/components/motion/Stagger";
import StaggerItem from "@/components/motion/StaggerItem";
import { fetchPublishedBlogs } from "@/lib/blogApi";
import type { BlogPost } from "@/lib/types/blog";
import { fadeUp, EASE_OUT } from "@/lib/motion";

export default function BlogsListing() {
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const blogs = await fetchPublishedBlogs();
        if (active) setPosts(blogs);
      } catch {
        if (active) {
          setError("Could not load blogs. Is the backend and MongoDB running?");
          setPosts([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const query = search.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    if (!query) return true;

    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      post.author.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="relative mx-auto max-w-xl">
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
      </div>

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

      {!loading && !error && filteredPosts.length > 0 && (
        <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <StaggerItem key={post.slug}>
              <BlogCard post={post} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {!loading && !error && filteredPosts.length === 0 && (
        <motion.div
          className="mt-16 text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <p className="text-lg font-medium text-foreground">No blogs found</p>
          <p className="mt-2 text-sm text-muted">
            {posts.length === 0
              ? "No published blogs yet. Add one from the admin panel."
              : "Try a different search term or browse all articles."}
          </p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
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
