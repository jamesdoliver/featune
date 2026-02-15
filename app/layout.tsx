import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ClientOverlays from "@/components/layout/ClientOverlays";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FEATUNE - Vocal Topline Marketplace",
  description:
    "Discover and license premium vocal toplines for your music production. AI and human vocals available.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-primary text-text-primary`}
      >
        <Header />
        <main className="min-h-screen pt-16 pb-20">{children}</main>
        <Footer />
        <ClientOverlays />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              border: '1px solid #2A2A2A',
              color: '#FFFFFF',
            },
          }}
        />
      </body>
    </html>
  );
}
