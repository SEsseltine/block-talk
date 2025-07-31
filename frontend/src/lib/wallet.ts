import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { createPublicClient, createWalletClient, custom, http, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

export const coinbaseWallet = new CoinbaseWalletSDK({
  appName: 'BlockTalk',
  appLogoUrl: 'https://example.com/logo.png', // Replace with actual logo
  darkMode: false,
});

export const ethereum = coinbaseWallet.makeWeb3Provider();

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

export const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: custom(ethereum),
});

export async function connectWallet(): Promise<Address | null> {
  try {
    const accounts = await ethereum.request({ 
      method: 'eth_requestAccounts' 
    }) as Address[];
    
    if (accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
}

export async function getConnectedAccount(): Promise<Address | null> {
  try {
    const accounts = await ethereum.request({ 
      method: 'eth_accounts' 
    }) as Address[];
    
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Failed to get connected account:', error);
    return null;
  }
}