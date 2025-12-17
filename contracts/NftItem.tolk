// NFT Item Contract in Tolk
// TEP-62 Compliant

struct StorageInitialized {
    index: uint64
    collectionAddress: address
    ownerAddress: address
    content: cell
}

struct StorageUninitialized {
    index: uint64
    collectionAddress: address
}

// Message types - simplified for auto-serialization
struct (0x5fcc3d14) Transfer {
    queryId: uint64
    newOwner: address
    responseDestination: address
    customPayload: cell?
    forwardAmount: coins
    forwardPayload: cell?
}

struct (0x05138d91) OwnershipAssigned {
    queryId: uint64
    prevOwner: address
}

struct (0xd53276db) Excesses {
    queryId: uint64
}

struct (0x2edb1232) GetStaticData {
    queryId: uint64
}

struct (0x8b771735) ReportStaticData {
    queryId: uint64
    index: uint64
    collection: address
}

type ItemMessage = Transfer | GetStaticData

fun onInternalMessage(in: InMessage) {
    var data = contract.getData().beginParse();
    val index = data.loadUint(64);
    val collectionAddress = data.loadAddress();
    
    // Check if initialized by checking if there's more data
    if (data.remainingBitsCount() == 0) {
        // Not initialized - only collection can initialize
        assert(in.senderAddress == collectionAddress) throw 405;
        
        var body = in.body;
        val ownerAddress = body.loadAddress();
        val content = body.loadRef();
        
        // Save initialized state
        val newData = beginCell()
            .storeUint(index, 64)
            .storeAddress(collectionAddress)
            .storeAddress(ownerAddress)
            .storeRef(content)
            .endCell();
        contract.setData(newData);
        return;
    }

    // Load full initialized storage
    val ownerAddress = data.loadAddress();
    val content = data.loadRef();

    // Accept empty messages
    if (in.body.isEmpty()) {
        return;
    }

    val msg = lazy ItemMessage.fromSlice(in.body);

    match (msg) {
        Transfer => {
            // Only current owner can transfer
            assert(in.senderAddress == ownerAddress) throw 401;

            val prevOwner = ownerAddress;
            
            // Save new owner
            val newData = beginCell()
                .storeUint(index, 64)
                .storeAddress(collectionAddress)
                .storeAddress(msg.newOwner)
                .storeRef(content)
                .endCell();
            contract.setData(newData);

            // Notify new owner if forward amount > 0
            if (msg.forwardAmount > 0) {
                val notification = OwnershipAssigned {
                    queryId: msg.queryId,
                    prevOwner: prevOwner
                };

                val notifyMsg = createMessage({
                    bounce: true,
                    dest: msg.newOwner,
                    value: msg.forwardAmount,
                    body: notification
                });
                notifyMsg.send(SEND_MODE_PAY_FEES_SEPARATELY);
            }

            // Return excess to response destination
            val excess = Excesses { queryId: msg.queryId };
            val excessMsg = createMessage({
                bounce: false,
                dest: msg.responseDestination,
                value: 0,
                body: excess
            });
            excessMsg.send(SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE + SEND_MODE_IGNORE_ERRORS);
        }

        GetStaticData => {
            val response = ReportStaticData {
                queryId: msg.queryId,
                index: index,
                collection: collectionAddress
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

// TEP-62 Required: Get NFT data
get fun get_nft_data(): (int, int, slice, slice, cell) {
    var data = contract.getData().beginParse();
    val index = data.loadUint(64);
    val collectionAddress = data.loadAddress();
    
    if (data.remainingBitsCount() == 0) {
        // Not initialized
        return (
            0,  // not initialized
            index,
            collectionAddress as slice,
            beginCell().endCell().beginParse(),  // empty slice for owner
            beginCell().endCell()  // empty cell for content
        );
    }
    
    val ownerAddress = data.loadAddress();
    val content = data.loadRef();
    
    return (
        -1,  // initialized (true = -1 in TVM)
        index,
        collectionAddress as slice,
        ownerAddress as slice,
        content
    );
}
