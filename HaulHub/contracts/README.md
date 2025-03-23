# HaulHub Smart Contracts

This directory contains the smart contracts for the HaulHub decentralized delivery platform.

## Contracts

- **HaulHub.sol**: Main contract that manages job creation, payment processing, and escrow.
- **BadgeNFT.sol**: NFT contract for issuing achievement badges to haulers.
- **DeliveryTracker.sol**: Contract for tracking delivery progress with location and proof data.

## Technology Stack

- Solidity 0.8.17
- Hardhat
- Ethers.js
- OpenZeppelin Contracts

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on the example provided and add your configuration.

3. Compile the contracts:
   ```bash
   npm run compile
   ```

4. Run tests:
   ```bash
   npm run test
   ```

## Contract Deployment

### Testnet (Mumbai)

```bash
npm run deploy:testnet
```

### Mainnet (Polygon)

```bash
npm run deploy:mainnet
```

## Post Deployment

After deploying, the contract ABIs are automatically exported to:
- `abis/` in this directory
- `../client/src/contracts/` for the frontend

Contract addresses are saved to `deployedAddresses.json` which is also copied to the client directory.

## Contract Verification

The deployment script automatically verifies the contracts on Polygonscan if the appropriate API keys are provided in the `.env` file.

## Scripts

- `npm run compile` - Compile the contracts
- `npm run export-abis` - Export contract ABIs
- `npm run build` - Compile contracts and export ABIs
- `npm run test` - Run contract tests
- `npm run deploy:testnet` - Deploy to Mumbai testnet
- `npm run deploy:mainnet` - Deploy to Polygon mainnet

## Testing

Tests are located in the `test/` directory. Run specific test files with:

```bash
npx hardhat test test/HaulHub.test.js
```

## Contract Architecture

### HaulHub Contract

Core contract that manages:
- Job creation and lifecycle
- Payment processing and escrow
- Fee collection
- Dispute resolution

### BadgeNFT Contract

Non-transferable NFT implementation that:
- Awards badges based on hauler achievements
- Supports badge levels that can be upgraded
- Uses a permissioned issuer system

### DeliveryTracker Contract

Specialized contract for:
- Tracking delivery status and milestones
- Storing location updates securely
- Managing delivery proofs
- Integration with the main HaulHub contract

## Security Considerations

The contracts include:
- Reentrancy protection
- Access controls for sensitive operations
- Ownership management
- Gas optimization for mobile usage

## License

MIT