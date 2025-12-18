# TON Build Badge Frontend

This is the frontend for the **TON Build Badge** project. It's built with Next.js and integrates with TON Connect to allow developers to verify their deployments and mint rewards.

## Key Features
- **Contract Verification**: Interface to input and verify TON smart contract addresses.
- **TON Connect Integration**: Securely connect TON wallets.
- **NFT Minting**: Trigger the minting process for the TON Build Badge.
- **Community Focused**: Links to TON documentation and community resources.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp env_local_example .env.local
   ```
   Update `.env.local` with your backend URL.

3. Run the development server:
   ```bash
   npm run dev
   ```

## Architecture
- `src/app/page.tsx`: Main dashboard and verification logic.
- `src/app/providers.tsx`: TON Connect and other global providers.
- `public/tonconnect-manifest.json`: Configuration for TON Connect.
