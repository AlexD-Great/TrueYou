# Credential NFT dApp Project Memory

## Project Overview
- **Name**: DecentraVerify (temporary project holder - will be replaced later)
- **Type**: Internet Computer (ICP) dApp for generating NFTs from verified credentials
- **Current Branch**: verification-requests
- **Tech Stack**: React frontend, Motoko backend, ICP blockchain

## Core Application Flow
1. **User uploads credential document** ✅ Working
2. **User requests for credential verification** ✅ Working  
3. **Reviewer approves credential** ✅ Working
4. **User generates NFT** (after successful credential approval) ❌ **NEEDS IMPLEMENTATION**

## Architecture
- **Frontend**: React app in `src/decentra_verify_m_frontend/`
- **Backend**: Motoko canister in `src/decentra_verify_m_backend/main.mo`
- **Build System**: npm workspaces, dfx for ICP deployment

## Key Features (Current Status)
- Dashboard with admin panel functionality
- Verification request system (Steps 1-3 complete)
- NFTs page (likely for Step 4 - needs refinement)
- Credential viewing capabilities
- User authentication via Internet Identity

## Development Commands
- `npm run build`: Build all workspaces
- `npm start`: Start development server
- `npm test`: Run tests
- `dfx deploy`: Deploy to ICP (inferred from dfx.json)

## Current State
- Clean git status on verification-requests branch
- Recent work focused on verification requests and dashboard improvements
- Authentication system in place with Internet Identity integration

## File Structure Notes
- Main app: `src/decentra_verify_m_frontend/src/App.jsx`
- Components: `src/decentra_verify_m_frontend/src/components/`
- Auth context: `src/decentra_verify_m_frontend/src/auth/AuthContext.jsx`
- Verification features: `src/decentra_verify_m_frontend/src/verification/`