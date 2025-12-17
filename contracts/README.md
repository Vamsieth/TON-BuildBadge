# TON NFT Contracts

Smart contracts for the TON Developer Onboarding NFT Collection, written in **Tolk**.

## Prerequisites

1. **Node.js** v22 or later
2. **TON Wallet** (Tonkeeper recommended) with testnet TON
3. Get testnet TON from faucet: https://t.me/testgiver_ton_bot

## Project Structure

```
contracts/
├── NftCollection.tolk       # Collection contract (TEP-62)
├── NftItem.tolk             # Item contract (TEP-62)
├── wrappers/                # TypeScript wrappers
│   ├── NftCollection.ts
│   ├── NftCollection.compile.ts
│   ├── NftItem.ts
│   └── NftItem.compile.ts
├── scripts/                 # Deployment scripts
│   ├── deployNftCollection.ts
│   └── mintNft.ts
└── build/                   # Compiled artifacts
```

## Installation

```bash
cd contracts
npm install
```

## Build Contracts

Compile both contracts:

```bash
npx blueprint build NftCollection
npx blueprint build NftItem
```

## Deploy to Testnet

### Step 1: Get Testnet TON

1. Open Tonkeeper wallet
2. Switch to Testnet (Settings → Network → Testnet)
3. Get free TON from @testgiver_ton_bot on Telegram

### Step 2: Deploy Collection

```bash
npx blueprint run deployNftCollection --testnet --tonconnect
```

This will:
1. Show a QR code
2. Scan with Tonkeeper
3. Approve the transaction (~0.05 TON)
4. Output the deployed collection address

### Step 3: Update Backend

Copy the collection address and update your backend `.env`:

```
COLLECTION_ADDRESS=EQ...your_deployed_address
```

## Mint an NFT (Manual Test)

After deployment, you can manually test minting:

1. Update `scripts/mintNft.ts` with your collection address
2. Run:

```bash
npx blueprint run mintNft --testnet --tonconnect
```

## Contract Details

### NftCollection (TEP-62 + TEP-66)

- **Owner**: Can mint new items and transfer ownership
- **Royalties**: 5% by default (configurable)
- **Metadata**: Off-chain (TEP-64)

### NftItem (TEP-62)

- **Transfer**: Standard NFT transfer support
- **Ownership**: Tracked on-chain
- **Content**: Off-chain metadata URL

## Gas Costs (Testnet)

| Operation | Cost |
|-----------|------|
| Deploy Collection | ~0.05 TON |
| Mint NFT | ~0.1 TON |
| Transfer NFT | ~0.05 TON |

## Troubleshooting

**"Wallet not connected"**: Make sure Tonkeeper is on testnet and you've scanned the QR code.

**"Insufficient balance"**: Get more testnet TON from the faucet.

**"Contract not found"**: Wait a few seconds for blockchain confirmation.

