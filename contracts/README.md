# Contracts

NFT Collection & Item contracts written in Tolk for the TON Build Badge project.

## Standards

- **TEP-62**: NFT Standard (collection data, item data, transfers)
- **TEP-64**: Off-chain metadata (content URIs)
- **TEP-66**: Royalty params (5% default)

## Files

```
contracts/
├── NftCollection.tolk          # Collection contract
├── NftItem.tolk                # Item contract
├── wrappers/
│   ├── NftCollection.ts        # Collection wrapper
│   ├── NftCollection.compile.ts
│   ├── NftItem.ts              # Item wrapper
│   └── NftItem.compile.ts
└── scripts/
    ├── deployNftCollection.ts  # Deploys collection to testnet
    └── mintNft.ts              # Mints single NFT
```

## Setup

```bash
npm install
```

Requires Node.js v22+ and a TON wallet with testnet TON.  
Get testnet TON: https://t.me/testgiver_ton_bot

## Build

```bash
npx blueprint build NftCollection
npx blueprint build NftItem
```

## Deploy

```bash
npx blueprint run deployNftCollection --testnet --tonconnect
```

Scan the QR code with Tonkeeper (testnet mode). Costs ~0.05 TON.

After deployment, copy the collection address to your backend `.env`:

```
COLLECTION_ADDRESS=EQ...
```

## Mint (Manual Test)

Update `COLLECTION_ADDRESS` in `scripts/mintNft.ts`, then:

```bash
npx blueprint run mintNft --testnet --tonconnect
```

## Contract Details

### NftCollection

**Storage:**
- `ownerAddress` - collection owner
- `nextItemIndex` - auto-incrementing item counter
- `content` - collection metadata URI (TEP-64)
- `nftItemCode` - compiled NftItem bytecode
- `royaltyFactor/royaltyBase` - royalty percentage (default 5/100)
- `royaltyAddress` - royalty recipient

**Operations:**

| Op Code | Name | Access |
|---------|------|--------|
| 0x00000001 | DeployNftItem | Anyone |
| 0x00000003 | ChangeOwner | Owner only |
| 0x693d3950 | GetRoyaltyParams | Anyone |

**Get Methods:**
- `get_collection_data()` → (nextItemIndex, content, owner)
- `get_nft_address_by_index(index)` → item address
- `get_nft_content(index, individualContent)` → content cell
- `royalty_params()` → (numerator, denominator, destination)

### NftItem

**Storage (after init):**
- `index` - item index in collection
- `collectionAddress` - parent collection
- `ownerAddress` - current NFT owner
- `content` - item metadata URI

**Operations:**

| Op Code | Name | Access |
|---------|------|--------|
| 0x5fcc3d14 | Transfer | Owner only |
| 0x2edb1232 | GetStaticData | Anyone |

**Get Methods:**
- `get_nft_data()` → (initialized, index, collection, owner, content)

## Gas Costs

| Operation | Cost |
|-----------|------|
| Deploy Collection | ~0.05 TON |
| Mint NFT | ~0.1 TON |
| Transfer NFT | ~0.05 TON |

## Troubleshooting

- **Wallet not connected**: Switch Tonkeeper to testnet, scan QR again
- **Insufficient balance**: Get more from @testgiver_ton_bot
- **Contract not found**: Wait a few seconds for confirmation
