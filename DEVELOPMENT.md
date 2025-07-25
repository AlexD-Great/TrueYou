# TrueYou - Development Guide

## Overview
TrueYou is a credential verification dApp built on the Internet Computer (ICP) using Motoko for the backend and React for the frontend. This guide covers local development, testing, and deployment workflows.

## Project Structure
```
src/
├── decentra_verify_m_backend/     # Motoko backend canister
│   └── main.mo                    # Main backend logic
├── decentra_verify_m_frontend/    # React frontend
│   ├── src/                       # React source code
│   ├── dist/                      # Built frontend assets
│   └── package.json               # Frontend dependencies
└── declarations/                  # Auto-generated canister interfaces
```

## Prerequisites

### Required Tools
```bash
# Install DFX (Internet Computer SDK)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Install Node.js (version 16 or higher)
# Download from https://nodejs.org/ or use nvm:
nvm install 16
nvm use 16

# Install Mops (Motoko package manager) - if needed
npm install -g ic-mops
```

### Verify Installation
```bash
dfx --version  # Should be 0.25.0 or higher
node --version # Should be 16.0.0 or higher
npm --version  # Should be 7.0.0 or higher
```

## Local Development

### 1. Initial Setup
```bash
# Clone and navigate to project
cd decentra-verify

# Install dependencies
npm install
cd src/decentra_verify_m_frontend && npm install && cd ../..
```

### 2. Start Local DFX Network
```bash
# Start the local Internet Computer replica (background)
dfx start --clean --background

# Or start in foreground to see detailed logs
dfx start --clean
```

### 3. Deploy Canisters Locally
```bash
# Deploy all canisters to local network
dfx deploy

# Or deploy individual canisters
dfx deploy decentra_verify_m_backend
dfx deploy decentra_verify_m_frontend
```

### 4. Start Frontend Development Server
```bash
# Start the Vite development server
npm start

# Or navigate to frontend directory
cd src/decentra_verify_m_frontend
npm start
```

### 5. Access Your Local Application
- **Frontend**: http://localhost:3000
- **Backend Candid UI**: http://127.0.0.1:4943/?canisterId={backend_canister_id}
- **DFX Dashboard**: http://127.0.0.1:4943/_/dashboard

## Development Workflow

### Making Changes

#### Backend Changes (Motoko)
1. Edit files in `src/decentra_verify_m_backend/`
2. Redeploy the backend:
   ```bash
   dfx deploy decentra_verify_m_backend
   ```

#### Frontend Changes (React)
1. Edit files in `src/decentra_verify_m_frontend/src/`
2. The Vite dev server auto-reloads, or manually rebuild:
   ```bash
   npm run build
   dfx deploy decentra_verify_m_frontend
   ```

### Full Reset (Clean Development Environment)
```bash
# Stop current instance
dfx stop

# Start fresh with clean state
dfx start --clean --background

# Redeploy everything
dfx deploy

# Start frontend
npm start
```

### View Logs and Debug
```bash
# View canister logs
dfx canister logs decentra_verify_m_backend

# Check canister status
dfx canister status decentra_verify_m_backend
dfx canister status decentra_verify_m_frontend

# List all canisters and their IDs
dfx canister id --all
```

## Network Environments

### Local Network (Development)
- **Purpose**: Isolated development environment
- **Benefits**: Fast, no cycles needed, full control
- **Usage**: `dfx deploy --network local` (default)

### Playground Network (Testing)
- **Purpose**: Free testnet environment
- **Benefits**: Real ICP infrastructure, no cycles needed
- **Usage**: `dfx deploy --network playground`

### IC Mainnet (Production)
- **Purpose**: Production deployment
- **Requirements**: ICP tokens converted to cycles
- **Usage**: `dfx deploy --network ic`

## Network-Specific Commands

### Deploy to Different Networks
```bash
# Local development (default)
dfx deploy

# Playground testnet
dfx deploy --network playground

# IC mainnet
dfx deploy --network ic
```

### Check Network Connectivity
```bash
# Test local network
dfx ping local

# Test playground network
dfx ping playground

# Test IC mainnet
dfx ping ic
```

### View Network-Specific Information
```bash
# Local network status
dfx canister status decentra_verify_m_backend --network local

# Playground network status
dfx canister status decentra_verify_m_backend --network playground

# Mainnet status
dfx canister status decentra_verify_m_backend --network ic
```

## Environment Variables

The `.env` file is automatically generated and updated by DFX:

```bash
# Current environment variables (example)
DFX_NETWORK='local'
CANISTER_ID_DECENTRA_VERIFY_M_BACKEND='bkyz2-fmaaa-aaaaa-qaaaq-cai'
CANISTER_ID_DECENTRA_VERIFY_M_FRONTEND='bd3sg-teaaa-aaaaa-qaaba-cai'
CANISTER_ID_INTERNET_IDENTITY='rdmx6-jaaaa-aaaaa-aaadq-cai'
```

These variables change automatically when you deploy to different networks.

## Testing

### Manual Testing
1. **Authentication**: Test Internet Identity login/logout
2. **File Upload**: Upload credential documents
3. **Verification Flow**: Request and approve verifications
4. **NFT Generation**: Generate NFTs from verified credentials
5. **Admin Functions**: Test admin panel features (if admin user)

### Automated Testing
```bash
# Run frontend tests
cd src/decentra_verify_m_frontend
npm test

# Run all tests
npm test
```

## Building for Production

### Frontend Build
```bash
# Build optimized frontend
cd src/decentra_verify_m_frontend
npm run build

# Or from project root
npm run build
```

### Full Production Build
```bash
# Build all components
dfx build

# Deploy to mainnet (requires cycles)
dfx deploy --network ic
```

## Common Commands Reference

### Project Management
```bash
# Install all dependencies
npm install

# Start development (full stack)
dfx start --clean --background && dfx deploy && npm start

# Stop local network
dfx stop

# Clean build artifacts
dfx clean
```

### Canister Management
```bash
# List all canisters
dfx canister id --all

# Get canister info
dfx canister info decentra_verify_m_backend

# Delete a canister (local only)
dfx canister delete decentra_verify_m_backend
```

### Identity Management
```bash
# List identities
dfx identity list

# Switch identity
dfx identity use default

# Get current principal
dfx identity get-principal
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes using port 4943
   lsof -ti:4943 | xargs kill -9
   dfx start --clean
   ```

2. **Canister Not Found**
   ```bash
   # Redeploy canisters
   dfx deploy
   ```

3. **Frontend Not Loading**
   ```bash
   # Rebuild frontend
   cd src/decentra_verify_m_frontend
   npm run build
   dfx deploy decentra_verify_m_frontend
   ```

4. **Internet Identity Issues**
   ```bash
   # Clear browser storage and try again
   # Or use incognito/private browsing mode
   ```

### Debug Steps
1. Check DFX is running: `dfx ping local`
2. Verify canisters deployed: `dfx canister id --all`
3. Check logs: `dfx canister logs decentra_verify_m_backend`
4. Restart clean: `dfx stop && dfx start --clean && dfx deploy`

## Performance Tips

### Development Speed
- Use `dfx start --background` to run DFX in background
- Keep DFX running between development sessions
- Use `--upgrade-unchanged` flag for faster redeployments

### Resource Management
- Monitor canister memory usage
- Clean unused build artifacts regularly
- Use specific canister deployment when possible

## Security Considerations

### Development Security
- Never commit private keys or sensitive data
- Use different identities for development and production
- Test authentication flows thoroughly
- Validate all user inputs

### Network Security
- Local network is isolated and safe for testing
- Playground is public but ephemeral
- Mainnet requires careful cycle management

## Additional Resources

- **ICP Developer Documentation**: https://internetcomputer.org/docs
- **Motoko Language Guide**: https://internetcomputer.org/docs/current/motoko/intro
- **DFX Command Reference**: https://internetcomputer.org/docs/current/references/cli-reference/dfx-parent
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/

## Contributing

1. Create feature branch from `main`
2. Test changes locally with `dfx start --clean && dfx deploy`
3. Test on playground with `dfx deploy --network playground`
4. Create pull request with detailed description
5. Ensure all tests pass before merging

---

**Quick Start Command Summary:**
```bash
# Full development setup
dfx start --clean --background && dfx deploy && npm start

# Deploy to playground for testing
dfx deploy --network playground

# Production deployment (requires cycles)
dfx deploy --network ic
```