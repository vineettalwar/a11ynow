import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { SiteLayout } from "@/components/site-layout";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "accessibility.now",
  description: "EAA compliance platform — WCAG audits, remediation, and monitoring.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interTight.variable} ${jetbrainsMono.variable} ${playfair.variable} font-sans antialiased`}
      >
        <AppProviders>
          <SiteLayout>{children}</SiteLayout>
        </AppProviders>
      </body>
    </html>
  );
}
