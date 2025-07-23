# DecentraVerify - Credential NFT dApp

A decentralized application (dApp) built on the Internet Computer Protocol (ICP) that enables users to upload credentials, get them verified by reviewers, and mint NFTs from verified credentials.

## 🎯 Project Overview

DecentraVerify is a credential verification and NFT minting platform that provides:
- Secure credential upload and storage
- Peer-to-peer verification system
- NFT generation from verified credentials
- Decentralized identity management using Internet Identity

## 🏗️ Architecture

The application follows a decentralized architecture with:
- **Frontend**: React-based web application
- **Backend**: Motoko smart contracts (canisters) on ICP
- **Authentication**: Internet Identity integration
- **Storage**: On-chain credential storage with cryptographic signatures

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - Main UI framework
- **Vite 4.3.9** - Build tool and development server
- **TypeScript 5.1.3** - Type safety
- **Tailwind CSS 3.4.14** - Styling framework
- **React Router DOM 7.3.0** - Client-side routing

### Backend
- **Motoko** - Smart contract language for ICP
- **Internet Computer Protocol (ICP)** - Blockchain platform
- **DFINITY Agent 2.1.3** - ICP communication library
- **ECDSA & Schnorr Signatures** - Cryptographic signing

### Development Tools
- **DFX** - DFINITY SDK for local development
- **MOPS** - Motoko package manager
- **Node.js ≥16.0.0** - Runtime environment
- **npm ≥7.0.0** - Package manager

### External Integrations
- **Internet Identity** - Decentralized authentication
- **EVM RPC Canister** - Ethereum Virtual Machine integration

## 📋 Prerequisites

Before running this project locally, ensure you have:

1. **Node.js** (version 16.0.0 or higher)
2. **npm** (version 7.0.0 or higher)
3. **DFX** (DFINITY SDK) - [Installation Guide](https://internetcomputer.org/docs/current/developer-docs/setup/install/)
4. **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TrueYou
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Local ICP Replica
```bash
dfx start --background
```

### 4. Deploy Canisters
```bash
dfx deploy
```

### 5. Start Development Server
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🔧 Available Scripts

### Root Level Commands
- `npm run build` - Build all workspaces
- `npm run prebuild` - Run prebuild scripts for all workspaces
- `npm start` - Start development servers
- `npm test` - Run tests across all workspaces

### Frontend-Specific Commands
```bash
cd src/decentra_verify_m_frontend
```
- `npm run setup` - Complete setup with canister creation and deployment
- `npm run start` - Start Vite development server on port 3000
- `npm run build` - Build for production
- `npm run format` - Format code using Prettier

### DFX Commands
- `dfx deploy` - Deploy all canisters
- `dfx canister create <canister-name>` - Create a new canister
- `dfx generate` - Generate TypeScript declarations
- `dfx stop` - Stop local replica

## 📁 Project Structure

```
TrueYou/
├── docs/                           # Documentation and mockups
│   ├── mockups/                    # UI mockups
│   └── sitemap.txt                 # Application sitemap
├── src/
│   ├── decentra_verify_m_backend/  # Motoko backend canister
│   │   └── main.mo                 # Main backend logic
│   └── decentra_verify_m_frontend/ # React frontend application
│       ├── src/
│       │   ├── admin/              # Admin panel components
│       │   ├── auth/               # Authentication logic
│       │   ├── components/         # Reusable UI components
│       │   ├── context/            # React context providers
│       │   ├── credentials/        # Credential management
│       │   ├── dashboard/          # User dashboard
│       │   ├── verification/       # Verification system
│       │   ├── evm/                # EVM integration
│       │   └── App.jsx             # Main application component
│       ├── package.json            # Frontend dependencies
│       └── vite.config.js          # Vite configuration
├── dfx.json                        # DFX configuration
├── mops.toml                       # Motoko dependencies
├── package.json                    # Root package configuration
└── README.md                       # This file
```

## 🔑 Key Features

### User Features
- **Credential Upload**: Securely upload academic, professional, or personal credentials
- **Verification Requests**: Submit credentials for peer review
- **NFT Generation**: Mint NFTs from verified credentials
- **Dashboard**: Manage credentials, view status, and track NFTs
- **Internet Identity**: Secure, passwordless authentication

### Admin Features
- **Review Queue**: Review and approve/reject credential submissions
- **Admin Panel**: Manage users and system settings
- **Review History**: Track verification decisions

### Technical Features
- **Cryptographic Signatures**: ECDSA and Schnorr signature support
- **On-chain Storage**: Decentralized credential storage
- **Cross-chain Integration**: EVM compatibility via RPC canister
- **Responsive Design**: Mobile-friendly interface

## 🔐 Environment Configuration

The application uses environment variables for configuration. A `.env` file is automatically generated by DFX containing canister IDs and network settings.

Key environment variables:
- `CANISTER_ID_DECENTRA_VERIFY_M_BACKEND` - Backend canister ID
- `CANISTER_ID_DECENTRA_VERIFY_M_FRONTEND` - Frontend canister ID
- `DFX_NETWORK` - Current network (local/ic)

## 🌐 Deployment

### Local Development
Follow the "Getting Started" section above.

### Internet Computer Mainnet
1. Configure your identity: `dfx identity use default`
2. Add cycles to your wallet
3. Deploy to mainnet: `dfx deploy --network ic`



## 🔄 Development Status

**Current Implementation Status:**
- ✅ User credential upload
- ✅ Verification request system  
- ✅ Reviewer approval workflow



