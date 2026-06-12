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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230891b2'/><text x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='system-ui' font-weight='900' font-size='20' fill='white'>A</text></svg>" />
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
