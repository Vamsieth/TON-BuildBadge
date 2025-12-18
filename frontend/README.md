# Frontend

Next.js app for TON Build Badge - verify deployments and mint NFT rewards.

## Stack

- Next.js 16 (App Router)
- TailwindCSS 4
- TON Connect UI React

## Setup

```bash
npm install
cp env_local_example .env.local
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_MANIFEST_URL=<optional, auto-detected>
```

## Structure

```
src/app/
├── page.tsx        # Main UI - verification form, mint button, examples
├── providers.tsx   # TonConnectUIProvider wrapper
├── layout.tsx      # Root layout
└── globals.css     # Tailwind styles

public/
├── tonconnect-manifest.json   # TON Connect app manifest
└── assets/
    ├── collection-metadata.json
    ├── item-metadata.json
    └── verified-badge.svg
```

## Features

**Contract Verification**  
Enter a TON contract address → backend checks if it's deployed and active on testnet.

**Wallet Connection**  
TON Connect integration via `@tonconnect/ui-react`. Works with Tonkeeper, OpenMask, etc.

**NFT Minting**  
After verification, click "Claim Build Badge" → signs and sends mint transaction.

## TON Connect Manifest

Located at `public/tonconnect-manifest.json`. Update `url` and `iconUrl` for production:

```json
{
  "url": "https://yourapp.xyz",
  "name": "TON Build Badge",
  "iconUrl": "https://yourapp.xyz/icon.png"
}
```

## NFT Metadata

The app hosts TEP-64 off-chain metadata:

- `/assets/collection-metadata.json` - collection name, description, image
- `/assets/item-metadata.json` - item name, description, attributes

These URLs are stored on-chain when the collection is deployed.
