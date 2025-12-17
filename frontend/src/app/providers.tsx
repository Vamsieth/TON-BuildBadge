'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';

export function Providers({ children }: { children: React.ReactNode }) {
  // For ngrok: The manifest must be accessible without the warning page
  // Option 1: Use the full ngrok URL (make sure to click through warning page first)
  // Option 2: Use a hosted manifest on GitHub/CDN
  const manifestUrl = process.env.NEXT_PUBLIC_MANIFEST_URL || 
    (typeof window !== 'undefined' 
      ? `${window.location.origin}/tonconnect-manifest.json`
      : '/tonconnect-manifest.json');

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
    >
      {children}
    </TonConnectUIProvider>
  );
}

