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

export type NftItemConfig = {
    index: number;
    collectionAddress: Address;
};

export class NftItem implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0): NftItem {
        // Build initial data cell (DETERMINISTIC for address calculation)
        const data = beginCell()
            .storeUint(config.index, 64)
            .storeAddress(config.collectionAddress)
            .endCell();

        const init = { code, data };
        return new NftItem(contractAddress(workchain, init), init);
    }

    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        opts: {
            newOwner: Address;
            responseDestination: Address;
            forwardAmount?: bigint;
            forwardPayload?: Cell;
            value?: bigint;
        }
    ) {
        const body = beginCell()
            .storeUint(0x5fcc3d14, 32)  // op::transfer
            .storeUint(0, 64)           // query_id
            .storeAddress(opts.newOwner)
            .storeAddress(opts.responseDestination)
            .storeBit(false)            // no custom payload
            .storeCoins(opts.forwardAmount ?? 0)
            .storeBit(false)            // no forward payload
            .endCell();

        await provider.internal(via, {
            value: opts.value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    async getNftData(provider: ContractProvider) {
        const result = await provider.get('get_nft_data', []);
        return {
            initialized: result.stack.readBoolean(),
            index: result.stack.readNumber(),
            collectionAddress: result.stack.readAddress(),
            ownerAddress: result.stack.readAddress(),
            content: result.stack.readCell(),
        };
    }
}

