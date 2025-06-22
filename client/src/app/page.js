"use client";

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { Button } from "@/components/ui/button";
import { useState } from "react";

const connector = metaMask();


export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();


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
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
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
        <div className="flex flex-col items-center space-y-4">
          <p className="text-white">Connected: {address}</p>
          <Button variant="secondary" size="lg" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
}
