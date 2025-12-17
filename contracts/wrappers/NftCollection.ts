import { 
    Address, 
    beginCell, 
    Cell, 
    Contract, 
    contractAddress, 
    ContractProvider, 
    Sender, 
    SendMode,
    toNano
} from '@ton/core';

export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex?: number;
    collectionContentUrl: string;  // Off-chain metadata URL
    nftItemCode: Cell;
    royaltyFactor?: number;        // e.g., 5 for 5%
    royaltyBase?: number;          // e.g., 100
    royaltyAddress?: Address;
};

export class NftCollection implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0): NftCollection {
        // Build collection content cell (TEP-64 off-chain format)
        const contentCell = beginCell()
            .storeUint(0x01, 8)  // Off-chain marker
            .storeBuffer(Buffer.from(config.collectionContentUrl))
            .endCell();

        // Build initial data cell - must match Tolk Storage struct layout
        // Tolk auto-serialization stores cell types as refs
        const data = beginCell()
            .storeAddress(config.ownerAddress)
            .storeUint(config.nextItemIndex ?? 0, 64)
            .storeRef(contentCell)
            .storeRef(config.nftItemCode)
            .storeUint(config.royaltyFactor ?? 5, 16)   // 5%
            .storeUint(config.royaltyBase ?? 100, 16)
            .storeAddress(config.royaltyAddress ?? config.ownerAddress)
            .endCell();

        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMintNft(
        provider: ContractProvider,
        via: Sender,
        opts: {
            itemIndex: number;
            itemOwnerAddress: Address;
            itemContentUrl: string;
            amount?: bigint;
            value?: bigint;
        }
    ) {
        // Build item content cell (TEP-64 off-chain format)
        const itemContent = beginCell()
            .storeUint(0x01, 8)  // Off-chain marker
            .storeBuffer(Buffer.from(opts.itemContentUrl))
            .endCell();

        // Build deploy message body (op = 1)
        const body = beginCell()
            .storeUint(1, 32)  // op::deploy_nft_item
            .storeUint(0, 64)  // query_id
            .storeUint(opts.itemIndex, 64)
            .storeCoins(opts.amount ?? toNano('0.05'))  // Amount to send to item
            .storeAddress(opts.itemOwnerAddress)
            .storeRef(itemContent)
            .endCell();

        await provider.internal(via, {
            value: opts.value ?? toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    async sendChangeOwner(
        provider: ContractProvider,
        via: Sender,
        newOwner: Address,
        value?: bigint
    ) {
        const body = beginCell()
            .storeUint(3, 32)  // op::change_owner
            .storeUint(0, 64)  // query_id
            .storeAddress(newOwner)
            .endCell();

        await provider.internal(via, {
            value: value ?? toNano('0.02'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    async getCollectionData(provider: ContractProvider) {
        const result = await provider.get('get_collection_data', []);
        return {
            nextItemIndex: result.stack.readNumber(),
            content: result.stack.readCell(),
            ownerAddress: result.stack.readAddress(),
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: number) {
        const result = await provider.get('get_nft_address_by_index', [
            { type: 'int', value: BigInt(index) }
        ]);
        return result.stack.readAddress();
    }

    async getRoyaltyParams(provider: ContractProvider) {
        const result = await provider.get('royalty_params', []);
        return {
            numerator: result.stack.readNumber(),
            denominator: result.stack.readNumber(),
            destination: result.stack.readAddress(),
        };
    }
}

