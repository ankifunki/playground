import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/funnel-sans/400.css";
import "@fontsource/funnel-sans/500.css";
import "./globals.css";
import { profile } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.joshiankit.com"),
  title: { default: profile.name, template: `%s · ${profile.name}` },
  description: `${profile.name}, ${profile.title.toLowerCase()}. Selected work and case studies.`,
  openGraph: { title: profile.name, description: `${profile.title}. Selected work and case studies.`, type: "website" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1011" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {children}
        <Script src="/delight.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
