import type { Metadata } from "next";
import "../index.css";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { SITE } from "@/lib/seo-config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "accessibility.now — WCAG audits, free tools & EAA compliance",
    template: `%s | ${SITE.name}`,
  },
  description: SITE.defaultDescription,
  alternates: {
    canonical: SITE.url,
  },
  openGraph: {
    type: "website",
    url: SITE.url,
    title: "accessibility.now — WCAG audits, free tools & EAA compliance",
    description: SITE.defaultDescription,
    siteName: SITE.name,
    images: [SITE.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "accessibility.now — WCAG audits, free tools & EAA compliance",
    description: SITE.defaultDescription,
    images: [SITE.ogImage],
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
