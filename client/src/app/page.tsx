"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowBigRightDashIcon } from "lucide-react";

const connector = metaMask();


export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const router = useRouter();


  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connectAsync({ connector });
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4 px-4">
      {!isConnected ? (
        <Button
          variant="secondary"
          size="lg"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <>
          <p className="text-white">Connected: {address}</p>
          <div className="flex space-x-4">
            <Button variant="secondary" size="lg" onClick={() => disconnect()}>
              Disconnect
            </Button>
            <Button variant="default" size="lg" onClick={() => router.push("/vc-form")}>
              Next <ArrowBigRightDashIcon/>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
