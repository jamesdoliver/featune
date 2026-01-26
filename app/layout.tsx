import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AudioPlayer from "@/components/player/AudioPlayer";
import CartDrawer from "@/components/cart/CartDrawer";
import ChatButton from "@/components/chat/ChatButton";
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
        <AudioPlayer />
        <CartDrawer />
        <ChatButton />
      </body>
    </html>
  );
}
