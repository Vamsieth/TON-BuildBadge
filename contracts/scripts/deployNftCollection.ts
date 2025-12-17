import { toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Compile NFT Item code first (needed for collection to deploy items)
    const nftItemCode = await compile('NftItem');

    // Get the deployer's address (the connected wallet)
    const deployer = provider.sender();
    const deployerAddress = deployer.address;

    if (!deployerAddress) {
        throw new Error('Deployer address not found. Please connect your wallet.');
    }

    console.log('Deployer address:', deployerAddress.toString());

    // Create collection with configuration
    // IMPORTANT: Update this URL to your deployed frontend!
    const collectionContentUrl = 'https://yourapp.xyz/assets/collection-metadata.json';

    const nftCollection = provider.open(
        NftCollection.createFromConfig(
            {
                ownerAddress: deployerAddress,
                nextItemIndex: 0,
                collectionContentUrl: collectionContentUrl,
                nftItemCode: nftItemCode,
                royaltyFactor: 5,   // 5% royalty
                royaltyBase: 100,
                royaltyAddress: deployerAddress,
            },
            await compile('NftCollection')
        )
    );

    console.log('Collection address:', nftCollection.address.toString());
    console.log('');
    console.log('Deploying NFT Collection...');

    // Deploy with 0.05 TON
    await nftCollection.sendDeploy(deployer, toNano('0.05'));

    // Wait for deployment
    await provider.waitForDeploy(nftCollection.address);

    console.log('');
    console.log('='.repeat(60));
    console.log('NFT Collection deployed successfully!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Collection Address:', nftCollection.address.toString());
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Copy the collection address above');
    console.log('2. Update your backend .env with:');
    console.log(`   COLLECTION_ADDRESS=${nftCollection.address.toString()}`);
    console.log('3. Update collection-metadata.json URL to your real frontend URL');
    console.log('');
}

