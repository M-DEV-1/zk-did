import { Inter } from "next/font/google";
import "./globals.css";
import WagmiWrapper from "@/components/wagmiWrapper";
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter",
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
        className={`${inter.variable} antialiased`}
      >
        <Toaster />
        <WagmiWrapper>{children}</WagmiWrapper>
      </body>
    </html>
  );
}
