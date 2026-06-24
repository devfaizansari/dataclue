import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import BlogPostView from "@/components/blogs/BlogPostView";
import JsonLd from "@/components/seo/JsonLd";
import { fetchPublishedBlogBySlugServer } from "@/lib/blogApi";
import { articleJsonLd, createPageMetadata } from "@/lib/seo";
import { resolveBlogSeo } from "@/lib/types/blog";

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
    return createPageMetadata({
      title: "Blog Not Found",
      description: "The requested blog post could not be found.",
      path: `/blogs/${slug}`,
      noIndex: true,
    });
  }

  const seo = resolveBlogSeo(post);

  return createPageMetadata({
    title: seo.title,
    description: seo.description,
    path: `/blogs/${post.slug}`,
    openGraphType: "article",
    publishedTime: post.createdAt,
    authors: [post.author],
    keywords: seo.keywords,
    ogImage: seo.ogImage,
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await fetchPublishedBlogBySlugServer(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
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
