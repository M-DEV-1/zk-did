// lib/wallet.js

import { createConfig, http } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

export const config = createConfig({
  appName: "ZK-DID",
  chains: [sepolia],
  connectors: [metaMask()],
  transports: {
    [sepolia.id]: http()
  },
});