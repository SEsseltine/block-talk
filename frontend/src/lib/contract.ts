import { type Address, type Hash, parseEther, formatEther } from 'viem';
import { publicClient, walletClient } from './wallet';

// Contract ABI - generated from our Solidity contract
export const BLOCK_TALK_ABI = [
  {
    "type": "function",
    "name": "registerPublicKey",
    "inputs": [{"name": "_publicKey", "type": "bytes32"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", 
    "name": "sendMessage",
    "inputs": [
      {"name": "_recipient", "type": "address"},
      {"name": "_encryptedContent", "type": "string"},
      {"name": "_makePermanent", "type": "bool"}
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getMessage", 
    "inputs": [{"name": "_messageId", "type": "bytes32"}],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "sender", "type": "address"},
          {"name": "recipient", "type": "address"},
          {"name": "encryptedContent", "type": "string"},
          {"name": "timestamp", "type": "uint256"},
          {"name": "isPermanent", "type": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPublicKey",
    "inputs": [{"name": "_user", "type": "address"}],
    "outputs": [{"name": "", "type": "bytes32"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRegistered",
    "inputs": [{"name": "_user", "type": "address"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserPermanentMessages",
    "inputs": [{"name": "_user", "type": "address"}],
    "outputs": [{"name": "", "type": "bytes32[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "permanentMessageFee",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "PublicKeyRegistered",
    "inputs": [
      {"name": "user", "type": "address", "indexed": true},
      {"name": "publicKey", "type": "bytes32", "indexed": true}
    ]
  },
  {
    "type": "event",
    "name": "MessageSent",
    "inputs": [
      {"name": "sender", "type": "address", "indexed": true},
      {"name": "recipient", "type": "address", "indexed": true},
      {"name": "encryptedContent", "type": "string", "indexed": false},
      {"name": "timestamp", "type": "uint256", "indexed": true},
      {"name": "isPermanent", "type": "bool", "indexed": false},
      {"name": "messageId", "type": "bytes32", "indexed": false}
    ]
  }
] as const;

// Contract address - will be set after deployment
export const CONTRACT_ADDRESS: Address = '0x0000000000000000000000000000000000000000'; // TODO: Update after deployment

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
  let value = 0n;
  
  if (makePermanent) {
    // Get permanent message fee
    value = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BLOCK_TALK_ABI,
      functionName: 'permanentMessageFee',
    });
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
  });

  return {
    sender: result[0],
    recipient: result[1],
    encryptedContent: result[2],
    timestamp: result[3],
    isPermanent: result[4],
  };
}

export async function getPublicKey(userAddress: Address): Promise<string | null> {
  const result = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'getPublicKey',
    args: [userAddress],
  });

  // Convert bytes32 to hex string, removing padding
  const hex = result.slice(2); // Remove 0x prefix
  const trimmed = hex.replace(/0+$/, ''); // Remove trailing zeros
  return trimmed || null;
}

export async function isRegistered(userAddress: Address): Promise<boolean> {
  return await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'isRegistered',
    args: [userAddress],
  });
}

export async function getUserPermanentMessages(userAddress: Address): Promise<Hash[]> {
  return await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'getUserPermanentMessages',
    args: [userAddress],
  });
}

export async function getMessageEvents(
  userAddress?: Address,
  fromBlock: bigint = 0n
): Promise<MessageEvent[]> {
  const logs = await publicClient.getLogs({
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
    args: userAddress ? {
      sender: userAddress,
      recipient: userAddress,
    } : undefined,
    fromBlock,
  });

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
}

export async function getPermanentMessageFee(): Promise<string> {
  const fee = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BLOCK_TALK_ABI,
    functionName: 'permanentMessageFee',
  });

  return formatEther(fee);
}