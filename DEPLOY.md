# DecentraVerify - ICP Mainnet Deployment Guide

## Overview
This guide walks you through deploying the DecentraVerify dApp to the Internet Computer (ICP) mainnet. The application consists of:
- **Backend**: Motoko canister (`decentra_verify_m_backend`)
- **Frontend**: React application (`decentra_verify_m_frontend`)
- **Dependencies**: Internet Identity and EVM RPC canisters

## Prerequisites

### 1. Install Required Tools
```bash
# Install DFX (Internet Computer SDK)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Install Node.js (version 16 or higher)
# Download from https://nodejs.org/ or use nvm:
nvm install 16
nvm use 16

# Install Mops (Motoko package manager)
npm install -g ic-mops
```

### 2. Verify Installation
```bash
dfx --version  # Should be 0.25.0 or higher
node --version # Should be 16.0.0 or higher
npm --version  # Should be 7.0.0 or higher
mops --version
```

## Wallet Setup

### 1. Create Internet Identity
1. Visit [identity.ic0.app](https://identity.ic0.app)
2. Create a new Internet Identity
3. Save your recovery phrase securely

### 2. Set up DFX Identity
```bash
# Create a new dfx identity for mainnet deployment
dfx identity new mainnet --storage-mode=plaintext

# Use the new identity
dfx identity use mainnet

# Get your principal ID (save this for later)
dfx identity get-principal
```

### 3. Fund Your Wallet
```bash
# Get your account ID
dfx ledger account-id

# Fund your account with ICP tokens
# You can buy ICP from exchanges and transfer to this account ID
# Minimum recommended: 5-10 ICP for deployment and cycles
```

### 4. Convert ICP to Cycles
```bash
# Create cycles wallet (requires ICP in your account)
dfx ledger create-canister $(dfx identity get-principal) --amount 2.0

# Deploy cycles wallet
dfx identity deploy-wallet <CANISTER_ID_FROM_PREVIOUS_STEP>

# Check wallet balance
dfx wallet balance
```

## Project Preparation

### 1. Install Dependencies
```bash
# Install all dependencies
npm install

# Install frontend dependencies
cd src/decentra_verify_m_frontend
npm install
cd ../..
```

### 2. Configure for Mainnet
```bash
# Switch to mainnet network
dfx start --clean --background --host 127.0.0.1:8080
dfx stop
```

### 3. Update dfx.json (if needed)
The current `dfx.json` is already configured correctly for mainnet deployment with proper Internet Identity and EVM RPC references.

## Deployment Process

### 1. Deploy to Mainnet
```bash
# Deploy to IC mainnet
dfx deploy --network ic --with-cycles 1000000000000

# Alternative: Deploy individual canisters with specific cycle amounts
dfx deploy decentra_verify_m_backend --network ic --with-cycles 500000000000
dfx deploy decentra_verify_m_frontend --network ic --with-cycles 500000000000
```

### 2. Verify Deployment
```bash
# Check canister status
dfx canister status decentra_verify_m_backend --network ic
dfx canister status decentra_verify_m_frontend --network ic

# Get canister IDs (save these)
dfx canister id decentra_verify_m_backend --network ic
dfx canister id decentra_verify_m_frontend --network ic
```

## Post-Deployment Configuration

### 1. Update Environment Variables
After deployment, update your local `.env` file with mainnet canister IDs:
```bash
# Update .env with mainnet canister IDs
DFX_NETWORK='ic'
CANISTER_ID_DECENTRA_VERIFY_M_FRONTEND='<YOUR_FRONTEND_CANISTER_ID>'
CANISTER_ID_DECENTRA_VERIFY_M_BACKEND='<YOUR_BACKEND_CANISTER_ID>'
CANISTER_ID_EVM_RPC='7hfb6-caaaa-aaaar-qadga-cai'
CANISTER_ID_INTERNET_IDENTITY='rdmx6-jaaaa-aaaaa-aaadq-cai'
```

### 2. Access Your dApp
Your dApp will be available at:
```
https://<FRONTEND_CANISTER_ID>.ic0.app
```

### 3. Verify Internet Identity Integration
- Test login functionality with Internet Identity
- Ensure authentication flows work correctly
- Verify user sessions persist correctly

## Cycle Management

### 1. Monitor Cycle Balance
```bash
# Check cycle balance for each canister
dfx canister status decentra_verify_m_backend --network ic
dfx canister status decentra_verify_m_frontend --network ic
```

### 2. Top Up Cycles
```bash
# Top up backend canister
dfx canister deposit-cycles 1000000000000 decentra_verify_m_backend --network ic

# Top up frontend canister
dfx canister deposit-cycles 1000000000000 decentra_verify_m_frontend --network ic
```

### 3. Set Up Automatic Top-up (Recommended)
Consider implementing cycle monitoring and automatic top-up to prevent canister freezing.

## Security Considerations

### 1. Canister Controllers
```bash
# Check who controls your canisters
dfx canister info decentra_verify_m_backend --network ic
dfx canister info decentra_verify_m_frontend --network ic

# Add additional controllers if needed
dfx canister update-settings decentra_verify_m_backend --add-controller <PRINCIPAL_ID> --network ic
```

### 2. Backup Important Data
- Save your dfx identity and seed phrases
- Document all canister IDs and principal IDs
- Backup your Internet Identity recovery phrases

## Troubleshooting

### Common Issues

1. **Insufficient Cycles**
   ```bash
   # Error: "Canister has insufficient cycles"
   # Solution: Top up cycles as shown above
   ```

2. **Authentication Issues**
   ```bash
   # Error: "Request failed with status 401"
   # Solution: Check dfx identity and ensure proper authentication
   dfx identity whoami
   ```

3. **Build Failures**
   ```bash
   # Error: Build failures during deployment
   # Solution: Clean and rebuild
   npm run build
   dfx build --network ic
   ```

4. **Network Issues**
   ```bash
   # Error: "Network unreachable"
   # Solution: Check internet connection and dfx version
   dfx ping ic
   ```

## Monitoring and Maintenance

### 1. Regular Health Checks
- Monitor cycle consumption
- Check canister status weekly
- Test critical functionality monthly
- Monitor user feedback and reports

### 2. Updates and Upgrades
```bash
# For code updates, redeploy with upgrade flag
dfx deploy --network ic --upgrade-unchanged

# For major changes, consider migration strategies
```

### 3. Performance Monitoring
- Monitor response times
- Track user engagement
- Analyze error rates
- Monitor cycle consumption patterns

## Support and Resources

- **ICP Developer Forum**: [forum.dfinity.org](https://forum.dfinity.org)
- **Official Documentation**: [internetcomputer.org/docs](https://internetcomputer.org/docs)
- **Discord Community**: [discord.gg/cA7y6ezyE2](https://discord.gg/cA7y6ezyE2)
- **GitHub Issues**: Use the project's GitHub repository for technical issues

## Estimated Costs

### Initial Deployment
- Backend Canister: ~2-3 ICP in cycles
- Frontend Canister: ~1-2 ICP in cycles
- Total: ~3-5 ICP for initial deployment

### Monthly Operating Costs
- Backend: ~0.5-1 ICP/month (depending on usage)
- Frontend: ~0.2-0.5 ICP/month (depending on traffic)
- Total: ~0.7-1.5 ICP/month

*Note: Costs may vary based on actual usage patterns and network conditions*

---

**Important**: Always test thoroughly on the local network before deploying to mainnet. Keep your identity and wallet information secure, and maintain regular backups of critical data.