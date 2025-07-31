import { type Address, type Hash, formatEther, keccak256, encodePacked } from 'viem';
import { publicClient, getWalletClient, fallbackClients } from './wallet';

// Contract ABI - generated from our Solidity contract
export const BLOCK_TALK_ABI = [
  {
    "type": "function",
    "name": "registerPublicKey",
    "inputs": [{ "name": "_publicKey", "type": "bytes32" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "sendMessage",
    "inputs": [
      { "name": "_recipient", "type": "address" },
      { "name": "_encryptedContent", "type": "string" },
      { "name": "_makePermanent", "type": "bool" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getMessage",
    "inputs": [{ "name": "_messageId", "type": "bytes32" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "sender", "type": "address" },
          { "name": "recipient", "type": "address" },
          { "name": "encryptedContent", "type": "string" },
          { "name": "timestamp", "type": "uint256" },
          { "name": "isPermanent", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPublicKey",
    "inputs": [{ "name": "_user", "type": "address" }],
    "outputs": [{ "name": "", "type": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRegistered",
    "inputs": [{ "name": "_user", "type": "address" }],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserPermanentMessages",
    "inputs": [{ "name": "_user", "type": "address" }],
    "outputs": [{ "name": "", "type": "bytes32[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "permanentMessageFee",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "PublicKeyRegistered",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "publicKey", "type": "bytes32", "indexed": true }
    ]
  },
  {
    "type": "event",
    "name": "MessageSent",
    "inputs": [
      { "name": "sender", "type": "address", "indexed": true },
      { "name": "recipient", "type": "address", "indexed": true },
      { "name": "encryptedContent", "type": "string", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": true },
      { "name": "isPermanent", "type": "bool", "indexed": false },
      { "name": "messageId", "type": "bytes32", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "ConversationMessage",
    "inputs": [
      { "name": "conversationHash", "type": "bytes32", "indexed": true },
      { "name": "sender", "type": "address", "indexed": true },
      { "name": "recipient", "type": "address", "indexed": true },
      { "name": "encryptedContent", "type": "string", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false },
      { "name": "isPermanent", "type": "bool", "indexed": false },
      { "name": "messageId", "type": "bytes32", "indexed": false }
    ]
  }
] as const;

// Contract address - will be set after deployment
export const CONTRACT_ADDRESS: Address = '0x74c3741FD5B9e549BEa7dA129075B97821F64551'; // Updated with deployed contract

export interface Message {
  sender: Address;
  recipient: Address;
  encryptedContent: string;
  timestamp: bigint;
  isPermanent: boolean;
}

export interface MessageEvent {
  sender: Address;
  recipient: Address;
  encryptedContent: string;
  timestamp: bigint;
  isPermanent: boolean;
  messageId: Hash;
  blockNumber: bigint;
  transactionHash: Hash;
}

export async function registerPublicKey(
  account: Address,
  publicKeyHex: string
): Promise<Hash> {
  const walletClient = await getWalletClient();
  if (!walletClient) {
    throw new Error('Wallet not connected');
  }

  // Convert hex string to bytes32
  const publicKeyBytes32 = `0x${publicKeyHex.slice(0, 64).padEnd(64, '0')}` as Hash;

  const hash = await walletClient.writeContract({
    account,
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'registerPublicKey',
    args: [publicKeyBytes32],
  });

  return hash;
}

export async function sendMessage(
  account: Address,
  recipient: Address,
  encryptedContent: string,
  makePermanent: boolean = false
): Promise<Hash> {
  const walletClient = await getWalletClient();
  if (!walletClient) {
    throw new Error('Wallet not connected');
  }

  let value = BigInt(0);

  if (makePermanent) {
    // Get permanent message fee
    value = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BLOCK_TALK_ABI,
      functionName: 'permanentMessageFee',
    }) as bigint;
  }

  const hash = await walletClient.writeContract({
    account,
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'sendMessage',
    args: [recipient, encryptedContent, makePermanent],
    value,
  });

  return hash;
}

export async function getMessage(messageId: Hash): Promise<Message> {
  const result = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'getMessage',
    args: [messageId],
  }) as { sender: Address; recipient: Address; encryptedContent: string; timestamp: bigint; isPermanent: boolean };

  return {
    sender: result.sender,
    recipient: result.recipient,
    encryptedContent: result.encryptedContent,
    timestamp: result.timestamp,
    isPermanent: result.isPermanent,
  };
}

export async function getPublicKey(userAddress: Address): Promise<string | null> {
  const result = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'getPublicKey',
    args: [userAddress],
  }) as Hash;

  // Convert bytes32 to hex string, removing padding
  const hex = result.slice(2); // Remove 0x prefix
  const trimmed = hex.replace(/0+$/, ''); // Remove trailing zeros
  return trimmed || null;
}

export async function isRegistered(userAddress: Address): Promise<boolean> {
  try {
    console.log('Checking if user is registered:', userAddress);
    console.log('Contract address:', CONTRACT_ADDRESS);
    
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BLOCK_TALK_ABI,
      functionName: 'isRegistered',
      args: [userAddress],
    }) as boolean;
    
    console.log(`isRegistered result for ${userAddress}:`, result);
    return result;
  } catch (error) {
    console.error('Error checking registration:', error);
    throw error;
  }
}

export async function getUserPermanentMessages(userAddress: Address): Promise<Hash[]> {
  return await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'getUserPermanentMessages',
    args: [userAddress],
  }) as Hash[];
}

async function tryGetLogsWithClient(client: typeof publicClient, params: { userAddress?: Address; fromBlock: bigint }): Promise<unknown[]> {
  if (!params.userAddress) {
    // If no user address provided, get all events (not recommended for production)
    return await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'MessageSent',
        inputs: [
          { name: 'sender', type: 'address', indexed: true },
          { name: 'recipient', type: 'address', indexed: true },
          { name: 'encryptedContent', type: 'string', indexed: false },
          { name: 'timestamp', type: 'uint256', indexed: true },
          { name: 'isPermanent', type: 'bool', indexed: false },
          { name: 'messageId', type: 'bytes32', indexed: false }
        ]
      },
      fromBlock: params.fromBlock,
    });
  }

  // Get events where user is sender
  const sentLogs = await client.getLogs({
    address: CONTRACT_ADDRESS,
    event: {
      type: 'event',
      name: 'MessageSent',
      inputs: [
        { name: 'sender', type: 'address', indexed: true },
        { name: 'recipient', type: 'address', indexed: true },
        { name: 'encryptedContent', type: 'string', indexed: false },
        { name: 'timestamp', type: 'uint256', indexed: true },
        { name: 'isPermanent', type: 'bool', indexed: false },
        { name: 'messageId', type: 'bytes32', indexed: false }
      ]
    },
    args: {
      sender: params.userAddress,
    },
    fromBlock: params.fromBlock,
  });

  // Get events where user is recipient
  const receivedLogs = await client.getLogs({
    address: CONTRACT_ADDRESS,
    event: {
      type: 'event',
      name: 'MessageSent',
      inputs: [
        { name: 'sender', type: 'address', indexed: true },
        { name: 'recipient', type: 'address', indexed: true },
        { name: 'encryptedContent', type: 'string', indexed: false },
        { name: 'timestamp', type: 'uint256', indexed: true },
        { name: 'isPermanent', type: 'bool', indexed: false },
        { name: 'messageId', type: 'bytes32', indexed: false }
      ]
    },
    args: {
      recipient: params.userAddress,
    },
    fromBlock: params.fromBlock,
  });

  // Combine and deduplicate logs
  const allLogs = [...sentLogs, ...receivedLogs];
  const uniqueLogs = allLogs.filter((log, index, self) => 
    index === self.findIndex(l => l.transactionHash === log.transactionHash && l.logIndex === log.logIndex)
  );

  return uniqueLogs;
}

export async function getMessageEvents(
  userAddress?: Address,
  fromBlock: bigint = BigInt(0)
): Promise<MessageEvent[]> {
  const params = { userAddress, fromBlock };
  
  // Try primary client first
  try {
    console.log('Trying primary RPC endpoint...');
    const logs = await tryGetLogsWithClient(publicClient, params);
    console.log(`Successfully fetched ${logs.length} message events from primary RPC`);
    return logs.map(log => ({
      sender: log.args.sender!,
      recipient: log.args.recipient!,
      encryptedContent: log.args.encryptedContent!,
      timestamp: log.args.timestamp!,
      isPermanent: log.args.isPermanent!,
      messageId: log.args.messageId!,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }));
  } catch (primaryError: unknown) {
    console.error('Primary RPC failed:', primaryError instanceof Error ? primaryError.message : primaryError);
  }

  // Try fallback clients one by one
  for (let i = 0; i < fallbackClients.length; i++) {
    try {
      console.log(`Trying fallback RPC endpoint ${i + 1}/${fallbackClients.length}...`);
      const logs = await tryGetLogsWithClient(fallbackClients[i], params);
      console.log(`Successfully fetched ${logs.length} message events from fallback RPC ${i + 1}`);
      return logs.map(log => ({
        sender: log.args.sender!,
        recipient: log.args.recipient!,
        encryptedContent: log.args.encryptedContent!,
        timestamp: log.args.timestamp!,
        isPermanent: log.args.isPermanent!,
        messageId: log.args.messageId!,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      }));
    } catch (fallbackError: unknown) {
      console.error(`Fallback RPC ${i + 1} failed:`, fallbackError instanceof Error ? fallbackError.message : fallbackError);
      
      // If this is the last fallback, handle gracefully
      if (i === fallbackClients.length - 1) {
        console.warn('All RPC endpoints failed. This may be due to network congestion.');
        // Return empty array instead of throwing
        return [];
      }
    }
  }
  
  // Final fallback
  return [];
}

// Helper function to create conversation hash (same logic as in contract)
export function createConversationHash(address1: Address, address2: Address): Hash {
  const addr1 = address1.toLowerCase() as Address;
  const addr2 = address2.toLowerCase() as Address;
  
  // Use smaller address first for consistency (same as contract)
  const orderedAddresses = addr1 < addr2 ? [addr1, addr2] : [addr2, addr1];
  
  // Create hash using same logic as contract: keccak256(abi.encodePacked(addr1, addr2))
  const packedData = encodePacked(['address', 'address'], [orderedAddresses[0] as Address, orderedAddresses[1] as Address]);
  const hash = keccak256(packedData);
  
  return hash;
}

// New efficient function to get conversation messages using ConversationMessage event
export async function getConversationMessages(
  user1: Address,
  user2: Address,
  fromBlock: bigint = BigInt(0)
): Promise<MessageEvent[]> {
  const conversationHash = createConversationHash(user1, user2);
  
  // Try fallback clients one by one
  for (let i = 0; i < fallbackClients.length; i++) {
    try {
      console.log(`Fetching conversation messages with client ${i + 1}...`);
      
      const logs = await fallbackClients[i].getLogs({
        address: CONTRACT_ADDRESS,
        event: {
          type: 'event',
          name: 'ConversationMessage',
          inputs: [
            { name: 'conversationHash', type: 'bytes32', indexed: true },
            { name: 'sender', type: 'address', indexed: true },
            { name: 'recipient', type: 'address', indexed: true },
            { name: 'encryptedContent', type: 'string', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false },
            { name: 'isPermanent', type: 'bool', indexed: false },
            { name: 'messageId', type: 'bytes32', indexed: false }
          ]
        },
        args: {
          conversationHash: conversationHash,
        },
        fromBlock,
      });

      console.log(`Successfully fetched ${logs.length} conversation messages`);
      return logs.map(log => ({
        sender: log.args.sender!,
        recipient: log.args.recipient!,
        encryptedContent: log.args.encryptedContent!,
        timestamp: log.args.timestamp!,
        isPermanent: log.args.isPermanent!,
        messageId: log.args.messageId!,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      }));
    } catch (error: unknown) {
      console.error(`Conversation query with client ${i + 1} failed:`, error instanceof Error ? error.message : error);
      
      // If this is the last client, return empty array
      if (i === fallbackClients.length - 1) {
        console.warn('All RPC endpoints failed for conversation query.');
        return [];
      }
    }
  }
  
  return [];
}

export async function getPermanentMessageFee(): Promise<string> {
  const fee = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'permanentMessageFee',
  }) as bigint;

  return formatEther(fee);
}