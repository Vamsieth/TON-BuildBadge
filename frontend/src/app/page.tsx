"use client";

import { useState } from "react";
import CodeBlock from "../components/CodeBlock";

// ------------------------------------------------------------------
// VERIFIED CONTRACT CONTENT
// ------------------------------------------------------------------

const NFT_COLLECTION_CODE = `// NFT Collection Contract in Tolk
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
`;

const NFT_ITEM_CODE = `// NFT Item Contract in Tolk
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
`;


export default function Home() {
  const [activeTab, setActiveTab] = useState<'collection' | 'item'>('collection');

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-tight text-ton-blue">Tolk</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-ton-blue">Documentation</a>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-ton-blue">Contracts</a>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-ton-blue">Community</a>
              <button className="bg-ton-blue text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#007AB8] transition-colors">
                Start Building
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-ton-dark mb-6">
            Build on <span className="gradient-text">TON</span> with <span className="gradient-text">Tolk</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed">
            The next-generation language for The Open Network. Write safe, efficient, and readable smart contracts with familiar syntax and powerful features.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-primary w-full sm:w-auto">
              Get Started
            </button>
            <button className="btn-secondary w-full sm:w-auto">
              Read the Docs
            </button>
          </div>

          <div className="mt-16 flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Mimic partner logos or trusted by section */}
            <div className="h-8 font-bold text-gray-400">TON FOUNDATION</div>
            <div className="h-8 font-bold text-gray-400">TELEGRAM</div>
            <div className="h-8 font-bold text-gray-400">TETHER</div>
          </div>
        </div>
      </section>

      {/* NFT Reference Implementation Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-start">

            {/* Left Content */}
            <div className="w-full md:w-1/3 pt-4">
              <div className="inline-block px-3 py-1 bg-blue-100 text-ton-blue rounded-full text-xs font-bold uppercase tracking-wide mb-4">
                Code Examples
              </div>
              <h2 className="text-3xl font-bold text-ton-dark mb-4">
                Standard NFT Collection
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Deploy compliant NFT collections with verified Tolk contracts. These examples implement TEP-62 (NFT Standard) and TEP-66 (Royalty Standard) natively.
              </p>

              <div className="space-y-4">
                <div
                  onClick={() => setActiveTab('collection')}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${activeTab === 'collection'
                      ? 'border-ton-blue bg-blue-50/50 shadow-sm ring-1 ring-[#0088CC]/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <h3 className="font-semibold text-ton-dark mb-1">NftCollection.tolk</h3>
                  <p className="text-sm text-gray-500">Handles minting, indexing, and collection metadata.</p>
                </div>

                <div
                  onClick={() => setActiveTab('item')}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${activeTab === 'item'
                      ? 'border-ton-blue bg-blue-50/50 shadow-sm ring-1 ring-[#0088CC]/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <h3 className="font-semibold text-ton-dark mb-1">NftItem.tolk</h3>
                  <p className="text-sm text-gray-500">Individual NFT logic, ownership transfers, and static data.</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <a href="#" className="flex items-center text-ton-blue font-medium hover:underline">
                  View Reference Docs
                  <span className="ml-2">→</span>
                </a>
              </div>
            </div>

            {/* Right Content (Code Block) */}
            <div className="w-full md:w-2/3">
              <CodeBlock
                key={activeTab} // Force re-render when tab changes
                code={activeTab === 'collection' ? NFT_COLLECTION_CODE : NFT_ITEM_CODE}
                language="tolk"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-ton-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center opacity-70 text-sm">
            <p>© 2025 Tolk Example Project. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
