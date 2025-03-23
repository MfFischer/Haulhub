# HaulHub Smart Contracts

This directory contains the smart contracts for the HaulHub decentralized delivery platform. The contracts are written in Solidity and are designed to run on the Polygon blockchain.

## Contracts

- **HaulHub.sol** - Main contract handling job creation, payments, and dispute resolution
- **BadgeNFT.sol** - NFT contract for hauler reputation badges
- **DeliveryTracker.sol** - Contract for tracking delivery progress and proofs

## Development

### Prerequisites

- Node.js v16+
- npm v8+
- Hardhat

### Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the provided example:
   ```
   cp .env.example .env
   ```
   
3. Fill in your environment variables in the `.env` file

### Compilation

Compile the contracts:
```
npm run compile
```

This will generate the artifacts in the `artifacts/` directory and export the ABIs to the `abis/` directory and to your client application.

### Testing

Run the tests:
```
npm run test
```

### Deployment

#### Deploy to Testnet (Mumbai)

1. Make sure you have MATIC on the Mumbai testnet. You can get some from the [Mumbai Faucet](https://faucet.polygon.technology/).

2. Deploy to Mumbai testnet:
   ```
   npm run deploy:testnet
   ```

#### Deploy to Mainnet

1. Ensure you have sufficient MATIC on Polygon mainnet.

2. Deploy to Polygon mainnet:
   ```
   npm run deploy:mainnet
   ```

### Contract Addresses

After deployment, contract addresses will be saved to `deployedAddresses.json`. They will also be automatically exported to your client application.

## Architecture

### HaulHub Contract

The main contract for the platform, handling:
- Job creation and payment escrow
- Job lifecycle (create, accept, complete)
- Fee calculations and payments
- Dispute resolution

### BadgeNFT Contract

NFT-based reputation system for haulers:
- Non-transferable badges
- Different badge types for different achievements
- Badge leveling system
- Controlled issuance

### DeliveryTracker Contract

Delivery tracking and proof system:
- Location updates throughout delivery
- Milestone tracking (pickup, dropoff, etc.)
- Proof of delivery system
- Integration with main HaulHub contract

## Gas Optimization

These contracts are optimized for the Polygon network to keep gas costs low while maintaining functionality:
- Efficient storage patterns
- Minimal state changes
- Batch operations for location updates
- Limited string storage (using IPFS hashes)

## License

[MIT](LICENSE)