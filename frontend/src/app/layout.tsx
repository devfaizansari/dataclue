import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ThemeProvider from "@/components/theme/ThemeProvider";
import AppSplashGate from "@/components/brand/AppSplashGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dataclue — Statistical Analysis, Made Simple",
  description:
    "Perform professional statistical tests directly in your browser. No installation, no data upload — just results.",
  icons: {
    icon: [{ url: "/brand/dataclue-logo.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AppSplashGate>{children}</AppSplashGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
