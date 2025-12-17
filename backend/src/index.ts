import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TonClient, Address, beginCell, toNano, Cell } from 'ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Placeholder Collection Address - You should deploy your contract and update this
const COLLECTION_ADDRESS = process.env.COLLECTION_ADDRESS || 'EQBYiv7_vS560zBsh6Gv-77983rXvp-3vVpX77-vS560zBlA';

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

/**
 * @route POST /verify
 * @desc Accepts contract address, returns validity & metadata
 */
app.post('/verify', async (req: Request, res: Response) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const parsedAddress = Address.parse(address);
    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    const client = new TonClient({ endpoint });

    const contractState = await client.getContractState(parsedAddress);
    
    if (contractState.state === 'active') {
      // Logic to verify if it's a "good" contract can be added here
      return res.json({
        address: address,
        exists: true,
        verified: true,
        metadata: {
          status: contractState.state,
          balance: contractState.balance.toString(),
          bytecodeHash: contractState.code ? Cell.fromBoc(contractState.code)[0]!.hash().toString('hex') : 'unknown'
        }
      });
    } else {
      return res.json({
        address: address,
        exists: true,
        verified: false,
        message: `Contract status is ${contractState.state}, not active.`
      });
    }
  } catch (error: any) {
    console.error('Verification error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify contract', 
      details: error.message 
    });
  }
});

/**
 * @route POST /mint
 * @desc Returns transaction payload for minting an NFT
 */
app.post('/mint', async (req: Request, res: Response) => {
  const { userAddress, contractAddress } = req.body;

  if (!userAddress || !contractAddress) {
    return res.status(400).json({ error: 'userAddress and contractAddress are required' });
  }

  try {
    // 1. In a real app, verify that contractAddress was successfully verified recently
    // and that userAddress is the owner or authorized to mint.

    // 2. Fetch nextItemIndex from the Collection contract
    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    const client = new TonClient({ endpoint });
    
    let nextItemIndex = 0;
    try {
        const collectionData = await client.callGetMethod(Address.parse(COLLECTION_ADDRESS), 'get_collection_data');
        nextItemIndex = Number(collectionData.stack.readBigNumber());
    } catch (e) {
        console.warn('Could not fetch collection data, using index 0 (is collection deployed?)');
    }

    // 3. Prepare item content (TEP-64 off-chain URI)
    // Use the frontend URL for metadata (set FRONTEND_URL in .env)
    const frontendUrl = process.env.FRONTEND_URL || 'https://a87ed5b4afa9.ngrok-free.app';
    const metadataUri = `${frontendUrl}/assets/item-metadata.json`;
    
    const itemContent = beginCell()
        .storeUint(0x01, 8) // Off-chain marker
        .storeBuffer(Buffer.from(metadataUri))
        .endCell();

    // 4. Build the OP_DEPLOY_NFT_ITEM message body
    // op=1, query_id=0, item_index, amount, itemOwnerAddress, item_content
    const mintBody = beginCell()
        .storeUint(1, 32) // op::deploy_nft_item
        .storeUint(0, 64) // query_id
        .storeUint(nextItemIndex, 64)
        .storeCoins(toNano('0.05')) // amount to carry to the item for storage
        .storeAddress(Address.parse(userAddress))
        .storeRef(itemContent)
        .endCell();

    res.json({
      message: 'Minting payload generated',
      payload: {
        address: COLLECTION_ADDRESS,
        amount: toNano('0.1').toString(), // Total amount to send (mint fee + gas)
        payload: mintBody.toBoc().toString('base64')
      }
    });
  } catch (error: any) {
    console.error('Minting payload error:', error);
    res.status(500).json({ error: 'Failed to generate minting payload' });
  }
});

app.get('/examples', (req: Request, res: Response) => {
  res.json([
    {
      title: 'Simple Counter',
      description: 'A basic counter contract - great first deployment!',
      address: 'EQBYiv7_vS560zBsh6Gv-77983rXvp-3vVpX77-vS560zBlA',
      docs: 'https://docs.ton.org/develop/smart-contracts/examples/counter'
    },
    {
      title: 'NFT Collection',
      description: 'Standard NFT collection contract.',
      address: 'EQD4P9S6vS560zBsh6Gv-77983rXvp-3vVpX77-vS560zBkM',
      docs: 'https://docs.ton.org/standard/tokens/nft/overview'
    }
  ]);
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
