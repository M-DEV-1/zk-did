import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WagmiWrapper from "@/components/wagmiWrapper";
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZK-DID",
  description: "empowering your decentralised identity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        <WagmiWrapper>{children}</WagmiWrapper>
      </body>
    </html>
  );
}
