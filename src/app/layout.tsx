import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Providers } from "@/components/providers";
import { brand } from "@/config/brand";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.subhead,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans min-h-screen flex flex-col antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-violet-600 focus:px-3 focus:py-1 focus:rounded"
        >
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" className="flex-1 w-full">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
