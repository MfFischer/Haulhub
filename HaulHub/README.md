# HaulHub

HaulHub is a decentralized micro-freight platform that enables anyone with a bike, car, or personal vehicle to deliver small items within local areas. Using a location-based app with blockchain payment processing, HaulHub creates a secure, efficient peer-to-peer delivery network.

## Features

- **Dual Roles**: Use the app as a Hauler (deliver items) or a Poster (request deliveries)
- **Location-Based**: Find nearby delivery opportunities or haulers
- **Regional Pricing**: Dynamic pricing based on location and local currency
- **Multiple Payment Options**: Traditional (credit cards, PayPal) and cryptocurrency (USDC on Polygon)
- **Real-Time Tracking**: Follow your delivery's progress in real-time
- **Reputation System**: Earn badges for good service and reliable deliveries

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/haulhub.git
   cd haulhub
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npm start
   # or
   yarn start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser

## Project Structure

```
HaulHub/
├── /client                  # Frontend (React)
│   ├── /public              # Static assets
│   ├── /src
│   │   ├── /components      # Reusable UI components
│   │   ├── /pages           # Main screens
│   │   ├── /hooks           # Custom React hooks
│   │   ├── /utils           # Utility functions
│   │   ├── /styles          # CSS and Tailwind styles
│   │   └── App.js           # Main app component
│
├── /server                  # Backend (Node.js) - To be implemented
│   ├── /api                 # REST endpoints
│   ├── /services            # Business logic
│   └── /config              # Server configuration
│
├── /contracts               # Solidity on Polygon - To be implemented
    ├── HaulHub.sol          # Main contract
    └── BadgeNFT.sol         # NFT badge contract
```

## Technology Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express (planned)
- **Blockchain**: Polygon/MATIC, USDC
- **Maps**: Mapbox (planned)
- **Authentication**: JWT (planned)

## Roadmap

1. **Phase 1**: Implement region detection and basic regional pricing ✅
2. **Phase 2**: Add currency conversion and local currency display ✅
3. **Phase 3**: Create map interface for haulers and posters
4. **Phase 4**: Implement blockchain payment processing
5. **Phase 5**: Add reputation and badge system
6. **Phase 6**: Implement real-time tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.