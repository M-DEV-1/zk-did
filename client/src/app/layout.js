import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WagmiWrapper from "@/components/wagmiWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ZK-DID",
  description: "empowering your decentralised identity",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WagmiWrapper>{children}</WagmiWrapper>
      </body>
    </html>
  );
}
