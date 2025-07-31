import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { createPublicClient, createWalletClient, custom, http, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

let coinbaseWallet: CoinbaseWalletSDK | null = null;
let ethereum: EthereumProvider | null = null;

function initializeWallet() {
  if (typeof window !== 'undefined' && !coinbaseWallet) {
    coinbaseWallet = new CoinbaseWalletSDK({
      appName: 'BlockTalk',
      appLogoUrl: 'https://example.com/logo.png', // Replace with actual logo
    });
    ethereum = coinbaseWallet.makeWeb3Provider() as EthereumProvider;
  }
  return { coinbaseWallet, ethereum };
}

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

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
  } catch (switchError: any) {
    // If the network isn't added to the wallet, add it
    if (switchError.code === 4902) {
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

export function getWalletClient() {
  const { ethereum } = initializeWallet();
  if (!ethereum) return null;
  
  return createWalletClient({
    chain: baseSepolia,
    transport: custom(ethereum),
  });
}