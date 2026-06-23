import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/theme/ThemeProvider";
import AppSplashGate from "@/components/brand/AppSplashGate";
import ScrollButtons from "@/components/layout/ScrollButtons";
import JsonLd from "@/components/seo/JsonLd";
import { organizationJsonLd, rootMetadata } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <JsonLd data={organizationJsonLd()} />
        <ThemeProvider>
          <AppSplashGate>{children}</AppSplashGate>
          <ScrollButtons />
        </ThemeProvider>
      </body>
    </html>
  );
}
