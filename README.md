# BlockTalk - Encrypted P2P Messenger

A decentralized messaging application that enables secure, end-to-end encrypted communication between wallet addresses. Built on Base blockchain with upgradeable smart contracts.

## 🏗️ Architecture

This is a monorepo containing:

- **`/forge`** - Smart contracts built with Foundry and Solady
- **`/frontend`** - Next.js 14 web application with Tailwind CSS
- **`/.github/workflows`** - CI/CD pipeline using block-contract-ci

## ✨ Features

- 🔐 **End-to-End Encryption** - Messages encrypted with wallet-derived keys
- 🌐 **Base Network** - Fast, low-cost transactions on Base Sepolia/Mainnet
- 📱 **Modern UI** - Responsive design with Tailwind CSS
- 🔄 **Upgradeable Contracts** - UUPS proxy pattern with Solady
- 🤖 **Automated CI/CD** - Smart contract deployment and frontend hosting

## 🚀 Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Git](https://git-scm.com/)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd block-talk
   ```

2. **Install dependencies**
   ```bash
   # Install smart contract dependencies
   cd forge
   forge install

   # Install frontend dependencies  
   cd ../frontend
   npm install
   ```

3. **Run tests**
   ```bash
   # Test smart contracts
   cd forge
   forge test

   # Test frontend
   cd ../frontend
   npm run build
   ```

4. **Start development server**
   ```bash
   cd frontend
   npm run dev
   ```

## 📄 Smart Contracts

### Core Contract: `BlockTalkMessenger`

Located in `/forge/src/BlockTalkMessenger.sol`

**Key Functions:**
- `registerPublicKey(bytes32)` - Register encryption public key
- `sendMessage(address, string, bool)` - Send encrypted message
- `getMessage(bytes32)` - Retrieve permanent message
- `getPublicKey(address)` - Get user's public key

**Features:**
- UUPS upgradeable proxy pattern
- Dual encryption (sender + recipient can decrypt)
- Hybrid storage (events + optional permanent storage)
- Gas-optimized with Solady

### Deployment

```bash
cd forge

# Deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify

# Deploy to Base Mainnet
forge script script/Deploy.s.sol --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

## 🖥️ Frontend Application

### Tech Stack

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **Blockchain:** Viem + Coinbase Wallet SDK
- **Deployment:** Vercel

### Key Components

- **WalletButton** - Connection and account display
- **RegistrationFlow** - Encryption key setup
- **MessagingInterface** - Chat interface with contacts

### Environment Variables

Create `.env.local` in `/frontend`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ENVIRONMENT=development
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The workflow automatically:

1. **Tests** smart contracts and frontend code
2. **Deploys contracts** to Base Sepolia using block-contract-ci
3. **Updates contract address** in frontend code
4. **Deploys frontend** to Vercel

### Required Secrets

Configure these in GitHub repository settings:

```
# Base Network
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_SEPOLIA_PRIVATE_KEY=0x...
BASE_MAINNET_RPC_URL=https://mainnet.base.org  
BASE_MAINNET_PRIVATE_KEY=0x...

# Block Explorer
BASESCAN_API_KEY=...

# Vercel
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

### Manual Deployment

Trigger deployments manually via GitHub Actions:

1. Go to Actions tab
2. Select "Deploy BlockTalk" workflow
3. Click "Run workflow" 
4. Choose environment (staging/production)

## 🔐 Security Features

### Encryption Flow

1. **Key Generation:** Derive encryption keys from wallet signature
2. **Message Encryption:** Encrypt with both sender and recipient public keys
3. **Storage:** Store encrypted message on blockchain
4. **Decryption:** Both parties can decrypt with their private keys

### Smart Contract Security

- **Access Control:** Only message participants can read messages
- **Upgradeable:** UUPS pattern for security updates
- **Testing:** Comprehensive test suite with 15+ test cases

## 📖 Documentation

### Contract Documentation
- [Solady Documentation](https://github.com/vectorized/solady)
- [UUPS Proxy Pattern](https://docs.openzeppelin.com/contracts/4.x/api/proxy)

### Frontend Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Viem Documentation](https://viem.sh/)
- [Coinbase Wallet SDK](https://docs.cloud.coinbase.com/wallet-sdk/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using [block-contract-ci](https://github.com/block-contract-ci/smart-contract-deploy)**
