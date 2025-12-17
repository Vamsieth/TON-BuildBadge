# TON Developer Reward: Deployment Checker & NFT Badge

This project allows developers to check if their smart contract is deployed on TON Testnet and claim a "Developer Badge" NFT as a reward.

## Project Structure

- `frontend/`: Next.js frontend with TON Connect integration.
- `backend/`: Express.js backend for deployment checking.
- `contracts/`: NFT Collection & Item contracts written in **Tolk**.

## Setup Instructions

### Backend

1. Navigate to `backend/`
2. Install dependencies: `npm install`
3. Copy `env_example` to `.env` and configure: `cp env_example .env`
4. Start dev server: `npm run dev`

### Frontend

1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Copy `env_local_example` to `.env.local`: `cp env_local_example .env.local`
4. Start dev server: `npm run dev`

### Contracts

- Smart contracts are located in the `contracts/` directory.
- They are written in **Tolk**, the modern language for TON.
- Use [Blueprint](https://github.com/ton-community/blueprint) to deploy them to TON Testnet.

## How it Works

1. **Check Deployment**: The user enters their TON contract address in the frontend.
2. **Validation**: The backend queries the TON blockchain to check if the contract exists and is active (deployed).
3. **Claim Reward**: If the contract is deployed, the user can connect their wallet via TON Connect and claim a "Developer Badge" NFT.

## Gas & Fees (Testnet)

- **Deployment Check**: Free (off-chain query via TonCenter).
- **Minting**: Approximately **0.1 TON** is sent in the minting transaction.
  - ~0.05 TON is used for the NFT item's initial storage and deployment fees.
  - ~0.05 TON covers the collection contract's processing fees and the remainder is returned to the user (excess).

## NFT Metadata (TEP-64)

The project uses **Off-chain Metadata** hosted within the Next.js app:
- **Image**: Uses TON official logo from `ton.org`
- **Item Metadata**: `/assets/item-metadata.json`
- **Collection Metadata**: `/assets/collection-metadata.json`

This teaches developers how TON NFTs link on-chain ownership with off-chain assets using a content URI.
