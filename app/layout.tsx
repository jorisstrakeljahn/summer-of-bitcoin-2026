import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summer of Bitcoin 2026 — Joris Strakeljahn",
  description:
    "Three Bitcoin development challenges: Transaction Parser, PSBT Builder, and Chain Analysis Engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
