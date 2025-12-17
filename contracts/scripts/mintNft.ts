import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider } from '@ton/blueprint';

// UPDATE THIS with your deployed collection address!
const COLLECTION_ADDRESS = 'EQ...your_collection_address_here';

export async function run(provider: NetworkProvider) {
    const deployer = provider.sender();
    const deployerAddress = deployer.address;

    if (!deployerAddress) {
        throw new Error('Wallet not connected');
    }

    // Open existing collection
    const collection = provider.open(
        new NftCollection(Address.parse(COLLECTION_ADDRESS))
    );

    // Get current collection data
    const collectionData = await collection.getCollectionData();
    console.log('Current next item index:', collectionData.nextItemIndex);

    // Mint new NFT to the connected wallet
    // IMPORTANT: Update this URL to your real metadata endpoint!
    const itemContentUrl = `https://yourapp.xyz/api/metadata/${collectionData.nextItemIndex}`;

    console.log('');
    console.log('Minting NFT #' + collectionData.nextItemIndex);
    console.log('To:', deployerAddress.toString());
    console.log('Metadata URL:', itemContentUrl);
    console.log('');

    await collection.sendMintNft(deployer, {
        itemIndex: collectionData.nextItemIndex,
        itemOwnerAddress: deployerAddress,
        itemContentUrl: itemContentUrl,
        amount: toNano('0.05'),  // Amount for item storage
        value: toNano('0.1'),    // Total tx value
    });

    console.log('Mint transaction sent! Wait for confirmation...');

    // Wait for the transaction
    await provider.waitForDeploy(
        await collection.getNftAddressByIndex(collectionData.nextItemIndex)
    );

    console.log('');
    console.log('NFT minted successfully!');
    console.log('NFT Address:', (await collection.getNftAddressByIndex(collectionData.nextItemIndex)).toString());
}

