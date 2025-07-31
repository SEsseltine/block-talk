import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { createPublicClient, createWalletClient, custom, http, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

let coinbaseWallet: CoinbaseWalletSDK | null = null;
let ethereum: EthereumProvider | null = null;

export function initializeWallet() {
  if (typeof window !== 'undefined' && !coinbaseWallet) {
    coinbaseWallet = new CoinbaseWalletSDK({
      appName: 'BlockTalk',
      appLogoUrl: 'https://example.com/logo.png', // Replace with actual logo
    });
    ethereum = coinbaseWallet.makeWeb3Provider() as EthereumProvider;
  }
  return { coinbaseWallet, ethereum };
}

// Multiple RPC endpoints for fallback
const BASE_SEPOLIA_RPCS = [
  'https://sepolia.base.org',
  'https://base-sepolia.g.alchemy.com/v2/demo',
  'https://base-sepolia-rpc.publicnode.com',
  'https://rpc.ankr.com/base_sepolia',
];

const currentRpcIndex = 0;

// Create fallback transport that tries multiple RPC endpoints
function createFallbackTransport() {
  return http(BASE_SEPOLIA_RPCS[currentRpcIndex], {
    retryCount: 2,
    retryDelay: 1000,
  });
}

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: createFallbackTransport(),
});

// Create alternative clients for each RPC endpoint
export const fallbackClients = BASE_SEPOLIA_RPCS.map(rpcUrl => 
  createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl, {
      retryCount: 1,
      retryDelay: 500,
    }),
  })
);

export async function connectWallet(): Promise<Address | null> {
  try {
    const { ethereum } = initializeWallet();
    if (!ethereum) return null;
    
    // Request account access
    const accounts = await ethereum.request({ 
      method: 'eth_requestAccounts' 
    }) as Address[];
    
    if (accounts.length > 0) {
      // Try to switch to Base Sepolia network
      await switchToBaseSepolia();
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
}

export async function switchToBaseSepolia(): Promise<void> {
  const { ethereum } = initializeWallet();
  if (!ethereum) throw new Error('Wallet not found');
  
  try {
    // Try to switch to Base Sepolia
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x14a34' }], // 84532 in hex
    });
  } catch (switchError: unknown) {
    // If the network isn't added to the wallet, add it
    if ((switchError as { code?: number })?.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x14a34',
            chainName: 'Base Sepolia',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org'],
          }],
        });
      } catch (addError) {
        console.error('Failed to add Base Sepolia network:', addError);
        throw new Error('Please manually add Base Sepolia network to your wallet');
      }
    } else {
      console.error('Failed to switch to Base Sepolia:', switchError);
      throw new Error('Please manually switch to Base Sepolia network');
    }
  }
}

export async function getConnectedAccount(): Promise<Address | null> {
  try {
    const { ethereum } = initializeWallet();
    if (!ethereum) return null;
    
    const accounts = await ethereum.request({ 
      method: 'eth_accounts' 
    }) as Address[];
    
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Failed to get connected account:', error);
    return null;
  }
}

export async function ensureWalletConnected(): Promise<Address> {
  const account = await getConnectedAccount();
  if (!account) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }
  
  // Ensure we're on the right network
  try {
    await switchToBaseSepolia();
  } catch (error) {
    console.warn('Failed to switch to Base Sepolia:', error);
  }
  
  return account;
}

export async function getWalletClient() {
  const { ethereum } = initializeWallet();
  if (!ethereum) {
    console.error('Ethereum provider not found');
    return null;
  }
  
  // Get the connected account first
  const account = await getConnectedAccount();
  if (!account) {
    console.error('No account connected');
    return null;
  }
  
  console.log('Creating wallet client with account:', account);
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: custom(ethereum),
  });
  
  console.log('Wallet client created:', client);
  return client;
}