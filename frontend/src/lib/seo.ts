import type { Metadata } from "next";
import type { BlogPost } from "@/lib/types/blog";
import { resolveBlogSeo } from "@/lib/types/blog";
import { faqItems } from "@/content/faq";
import { SITE } from "@/lib/site";

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function createPageMetadata({
  title,
  description = SITE.defaultDescription,
  path,
  noIndex = false,
  openGraphType = "website",
  publishedTime,
  authors,
  keywords,
  ogImage,
}: {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
  openGraphType?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  keywords?: string[];
  ogImage?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = `${title} — ${SITE.name}`;
  const image = ogImage?.trim() || SITE.ogImagePath;

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: openGraphType,
      locale: "en_US",
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          alt: fullTitle,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors?.length ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: getSiteUrl(),
    logo: absoluteUrl(SITE.ogImagePath),
    email: SITE.contactEmail,
    description: SITE.defaultDescription,
  };
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    url: getSiteUrl(),
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: SITE.defaultDescription,
  };
}

export function faqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function articleJsonLd(post: BlogPost) {
  const seo = resolveBlogSeo(post);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: seo.title,
    description: seo.description,
    keywords: seo.keywords.length ? seo.keywords.join(", ") : undefined,
    datePublished: post.createdAt,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(SITE.ogImagePath),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blogs/${post.slug}`),
    },
    ...(seo.ogImage ? { image: [absoluteUrl(seo.ogImage)] } : {}),
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.defaultDescription,
  keywords: [
    "statistical analysis",
    "online calculator",
    "t-test",
    "ANOVA",
    "regression",
    "SPSS alternative",
    "research statistics",
    "APA format results",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getSiteUrl(),
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.defaultDescription,
    images: [
      {
        url: SITE.ogImagePath,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.defaultDescription,
    images: [SITE.ogImagePath],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: getSiteUrl(),
  },
  icons: {
    icon: [{ url: "/brand/dataclue-logo.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};
