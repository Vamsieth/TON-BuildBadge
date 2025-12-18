# Backend

Express API for contract verification and NFT mint payload generation.

## Stack

- Express 5
- @orbs-network/ton-access (TON RPC)
- ton / ton-core

## Setup

```bash
npm install
cp env_example .env
npm run dev
```

## Environment Variables

```env
PORT=3001
COLLECTION_ADDRESS=EQ...  # Your deployed collection address
FRONTEND_URL=https://ton-build-badge.vercel.app
```

## API Endpoints

### `GET /health`
Health check.

### `POST /verify`
Check if a contract is deployed on testnet.

**Request:**
```json
{ "address": "EQ..." }
```

**Response:**
```json
{
  "address": "EQ...",
  "exists": true,
  "verified": true,
  "metadata": {
    "status": "active",
    "balance": "1000000000",
    "bytecodeHash": "abc123..."
  }
}
```

### `POST /mint`
Generate mint transaction payload.

**Request:**
```json
{
  "userAddress": "EQ...",
  "contractAddress": "EQ..."
}
```

**Response:**
```json
{
  "message": "Minting payload generated",
  "payload": {
    "address": "EQ...",
    "amount": "100000000",
    "payload": "<base64 BOC>"
  }
}
```

The frontend sends this payload via TON Connect.

### `GET /examples`
Returns example contracts for the UI.

## Scripts

```bash
npm run dev    # Start with hot reload
npm run build  # Compile TypeScript
npm start      # Run compiled JS
npm test       # Run verification tests
```
