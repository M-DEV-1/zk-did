import "./globals.css";
import WagmiWrapper from "@/components/wagmiWrapper";
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";

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
      <body className="antialiased">
        <Toaster />
        <WagmiWrapper>{children}</WagmiWrapper>
      </body>
    </html>
  );
}
