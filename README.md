# TON Build Badge

Verify your smart contract deployment and claim an NFT badge. Built for the TON developer community.

## Project Structure

```
ton-mint/
├── contracts/           # Tolk smart contracts (TEP-62 NFT standard)
│   ├── NftCollection.tolk
│   ├── NftItem.tolk
│   ├── wrappers/        # TypeScript contract wrappers
│   └── scripts/         # Deploy & mint scripts
├── backend/             # Express API for verification & minting
│   └── src/index.ts
└── frontend/            # Next.js app with TON Connect
    └── src/app/
```

## Quick Start

### 1. Deploy Contracts

```bash
cd contracts
npm install
npx blueprint build NftCollection
npx blueprint build NftItem
npx blueprint run deployNftCollection --testnet --tonconnect
```

### 2. Start Backend

```bash
cd backend
npm install
# Set COLLECTION_ADDRESS in .env to your deployed address
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## Smart Contracts

Two Tolk contracts implementing the NFT standard:

| Contract | Standard | Purpose |
|----------|----------|---------|
| `NftCollection.tolk` | TEP-62, TEP-64, TEP-66 | Manages collection, mints items, handles royalties |
| `NftItem.tolk` | TEP-62 | Individual NFT with transfer support |

**Supported Operations:**
- `DeployNftItem` (op=1) - Mint new NFT
- `ChangeOwner` (op=3) - Transfer collection ownership
- `GetRoyaltyParams` (op=0x693d3950) - Query royalty info
- `Transfer` (op=0x5fcc3d14) - Transfer NFT item

## How It Works

1. User enters a contract address in the frontend
2. Backend queries TON testnet to verify the contract is deployed and active
3. If verified, user connects wallet via TON Connect
4. Backend generates mint payload, frontend sends the transaction
5. NFT is minted to the user's wallet

## Gas Costs (Testnet)

| Operation | Cost |
|-----------|------|
| Deploy Collection | ~0.05 TON |
| Mint NFT | ~0.1 TON |
| Transfer NFT | ~0.05 TON |

## Tech Stack

- **Contracts**: Tolk + Blueprint
- **Backend**: Express 5, @orbs-network/ton-access
- **Frontend**: Next.js 16, TailwindCSS 4, @tonconnect/ui-react

## Resources

- [TON Docs](https://docs.ton.org)
- [Tolk Language](https://docs.ton.org/languages/tolk/overview)
- [TEP-62 NFT Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md)
- [Blueprint](https://github.com/ton-community/blueprint)
