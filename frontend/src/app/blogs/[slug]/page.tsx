import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import BlogPostView from "@/components/blogs/BlogPostView";
import { fetchPublishedBlogBySlugServer } from "@/lib/blogApi";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublishedBlogBySlugServer(slug);

  if (!post) {
    return { title: "Blog Not Found — dataclue" };
  }

  return {
    title: `${post.title} — dataclue`,
    description: post.excerpt,
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await fetchPublishedBlogBySlugServer(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface py-12 sm:py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <BlogPostView post={post} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
