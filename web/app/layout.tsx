/**
 * Root layout: metadata, theme, fonts, and providers for the Bitcoin chain analysis app.
 */
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { InfoPanelProvider } from "@/components/info-panel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sherlock — Bitcoin Chain Analysis",
  description: "Interactive chain analysis dashboard for Bitcoin block data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <InfoPanelProvider>{children}</InfoPanelProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
