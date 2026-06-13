import type { Metadata } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ADX Bank — AI-Powered Digital Banking",
    template: "%s — ADX Bank",
  },
  description:
    "ADX Bank is a full-stack digital banking platform with a multi-agent AI assistant. Transfer money, manage loans, and get instant AI-powered financial guidance.",
  openGraph: {
    title: "ADX Bank — AI-Powered Digital Banking",
    description:
      "A banking platform with a 3-layer multi-agent AI brain. Built with Next.js, FastAPI, and ChromaDB.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' fill='none'><rect width='40' height='40' rx='9' fill='%230D1F3C'/><polyline points='4,33 15,12 22,21' stroke='%23D4AF37' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/><polyline points='22,21 29,8 36,33' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/></svg>" />
      </head>
      <body className="min-h-screen font-body">
        <Providers>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-8 pt-24">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
