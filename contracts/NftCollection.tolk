// NFT Collection Contract in Tolk
// TEP-62 Compliant with TEP-64 Off-chain metadata and TEP-66 Royalties

struct Storage {
    ownerAddress: address
    nextItemIndex: uint64
    content: cell          // Collection metadata (off-chain URI)
    nftItemCode: cell      // Compiled NFT Item bytecode
    royaltyFactor: uint16  // numerator
    royaltyBase: uint16    // denominator
    royaltyAddress: address
}

// Load storage from contract data
fun Storage.load() {
    return Storage.fromCell(contract.getData());
}

// Save storage to contract data
fun Storage.save(self) {
    contract.setData(self.toCell());
}

// Message types
struct (0x00000001) DeployNftItem {
    queryId: uint64
    itemIndex: uint64
    amount: coins
    itemOwnerAddress: address
    itemContent: cell
}

struct (0x00000003) ChangeOwner {
    queryId: uint64
    newOwnerAddress: address
}

struct (0x693d3950) GetRoyaltyParams {
    queryId: uint64
}

struct (0xa8e22f26) ReportRoyaltyParams {
    queryId: uint64
    numerator: uint16
    denominator: uint16
    destination: address
}

type CollectionMessage = DeployNftItem | ChangeOwner | GetRoyaltyParams

fun onInternalMessage(in: InMessage) {
    // Empty messages are allowed (simple transfers)
    if (in.body.isEmpty()) {
        return;
    }

    val msg = lazy CollectionMessage.fromSlice(in.body);
    var storage = lazy Storage.load();

    match (msg) {
        DeployNftItem => {
            // For gamification: Allow anyone to mint
            // The NFT will be owned by msg.itemOwnerAddress (the sender's specified address)
            // In production, add verification logic here (e.g., check if sender verified a contract)
            
            // Item index must be valid
            assert(msg.itemIndex <= storage.nextItemIndex) throw 402;

            // Build NFT Item initial data (DETERMINISTIC for address calculation)
            val itemData = beginCell()
                .storeUint(msg.itemIndex, 64)
                .storeAddress(contract.getAddress())  // collection address
                .endCell();

            // Calculate item address and deploy
            val stateInit: ContractState = {
                code: storage.nftItemCode,
                data: itemData
            };

            // Send deploy message with initialization data in body
            val deployMsg = createMessage({
                bounce: false,
                dest: { stateInit: stateInit },
                value: msg.amount,
                body: beginCell()
                    .storeAddress(msg.itemOwnerAddress)
                    .storeRef(msg.itemContent)
                    .endCell()
            });
            deployMsg.send(SEND_MODE_PAY_FEES_SEPARATELY);

            // Increment index if this is the next item
            if (msg.itemIndex == storage.nextItemIndex) {
                storage.nextItemIndex += 1;
                storage.save();
            }
        }

        ChangeOwner => {
            assert(in.senderAddress == storage.ownerAddress) throw 401;
            storage.ownerAddress = msg.newOwnerAddress;
            storage.save();
        }

        GetRoyaltyParams => {
            val response = ReportRoyaltyParams {
                queryId: msg.queryId,
                numerator: storage.royaltyFactor,
                denominator: storage.royaltyBase,
                destination: storage.royaltyAddress
            };
            
            val responseMsg = createMessage({
                bounce: false,
                dest: in.senderAddress,
                value: 0,
                body: response
            });
            responseMsg.send(SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE);
        }

        else => {
            throw 0xFFFF;
        }
    }
}

// Helper function to calculate item address
fun calculateItemAddress(code: cell, data: cell): address {
    // Build stateInit cell: 0b00110 (code:1, data:1, library:0, split_depth:0, special:0)
    val stateInit = beginCell()
        .storeUint(0, 2)  // split_depth and special
        .storeUint(1, 1)  // has code
        .storeUint(1, 1)  // has data
        .storeUint(0, 1)  // no library
        .storeRef(code)
        .storeRef(data)
        .endCell();
    
    val stateInitHash = stateInit.hash();
    return address.fromWorkchainAndHash(0, stateInitHash);
}

// TEP-62 Required: Get collection data
get fun get_collection_data(): (int, cell, slice) {
    val storage = lazy Storage.load();
    return (storage.nextItemIndex, storage.content, storage.ownerAddress as slice);
}

// TEP-62 Required: Get NFT address by index
get fun get_nft_address_by_index(index: int): slice {
    val storage = lazy Storage.load();
    
    // Build item data cell (SAME as during deployment)
    val itemData = beginCell()
        .storeUint(index, 64)
        .storeAddress(contract.getAddress())
        .endCell();
    
    val itemAddress = calculateItemAddress(storage.nftItemCode, itemData);
    return itemAddress as slice;
}

// TEP-62 Required: Get NFT content
get fun get_nft_content(index: int, individualContent: cell): cell {
    // For off-chain metadata, we return the individual content as-is
    // The collection URI + individual content form the full metadata URL
    return individualContent;
}

// TEP-66 Required: Get royalty params
get fun royalty_params(): (int, int, slice) {
    val storage = lazy Storage.load();
    return (storage.royaltyFactor, storage.royaltyBase, storage.royaltyAddress as slice);
}
