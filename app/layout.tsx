import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verdact | Verifiable RAG",
  description: "Verdact is a verifiable RAG product built on Shelby, with source provenance, receipt hashes, and document evidence."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="preconnect" href="https://api.fontshare.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500&display=swap"
            rel="stylesheet"
          />
          <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
        </head>
        <body>
          <SmoothScroll>{children}</SmoothScroll>
        </body>
      </html>
    </ClerkProvider>
  );
}
