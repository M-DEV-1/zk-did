// components/WagmiWrapper.jsx
'use client';

import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wallet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function WagmiWrapper({ children }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}

/*

- created a seperate wrapper component as you can't directly integrate this in layout.js




*/