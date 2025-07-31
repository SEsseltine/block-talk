import { type Address } from 'viem';

interface WalletButtonProps {
  account: Address | null;
  isConnecting: boolean;
  onConnect: () => void;
}

export function WalletButton({ account, isConnecting, onConnect }: WalletButtonProps) {
  if (account) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
        
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {account.slice(2, 4).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={isConnecting}
      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Connecting...
        </>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}