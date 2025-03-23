# HaulHub Server

This is the backend API server for HaulHub, a decentralized delivery platform powered by blockchain technology.

## Features

- **Blockchain Integration**: Smart contract interaction with Polygon/Ethereum
- **Authentication**: JWT-based user authentication
- **Job Management**: Create, accept, complete, and track delivery jobs
- **Geolocation**: Location tracking and geocoding services
- **Payments**: Cryptocurrency transaction management
- **Notifications**: Push notifications for both web and mobile
- **Dynamic Pricing**: Region-specific price calculation

## Tech Stack

- **Node.js & Express**: API framework
- **MongoDB & Mongoose**: Database and ODM
- **Ethers.js**: Blockchain interaction
- **Web Push & Firebase**: Push notifications
- **JWT**: Authentication
- **Winston**: Logging
- **Express-Validator**: Request validation

## Requirements

- Node.js (v16+)
- MongoDB
- Polygon/Ethereum wallet with MATIC
- Google Maps API key or Mapbox access token (for geocoding)
- Firebase Admin SDK (for mobile push notifications)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/haulhub.git
   cd haulhub/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration values

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

See the `.env` file for all required environment variables.

Key variables include:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `HAULHUB_CONTRACT_ADDRESS`: Address of deployed HaulHub smart contract
- `ADMIN_PRIVATE_KEY`: Private key for blockchain transactions

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/wallet` - Link wallet address

### Jobs
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/nearby` - Get nearby jobs
- `POST /api/jobs` - Create a new job
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/claim` - Claim a job
- `POST /api/jobs/:id/complete` - Complete a job

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/vehicle` - Add a vehicle
- `GET /api/users/badges` - Get user badges
- `POST /api/users/rate` - Rate a hauler

### Payments
- `GET /api/payments/balance` - Get wallet balance
- `GET /api/payments/transactions` - Get transaction history
- `POST /api/payments/withdraw` - Withdraw funds
- `GET /api/payments/gas-estimate` - Get gas price estimate

### Location
- `POST /api/location/update` - Update user location
- `GET /api/location/nearby-haulers` - Find nearby haulers
- `GET /api/location/geocode` - Convert address to coordinates
- `GET /api/location/reverse-geocode` - Convert coordinates to address
- `GET /api/location/job-route` - Get route for a job

## Project Structure

```
server/
├── api/                   # API routes
│   ├── auth.js            # Authentication routes
│   ├── jobs.js            # Job-related routes
│   ├── payments.js        # Payment routes
│   ├── location.js        # Location routes
│   └── users.js           # User routes
├── config/                # Configuration files
│   ├── db.js              # Database configuration
│   └── passport.js        # Authentication configuration
├── contracts/             # Smart contract ABIs
│   ├── HaulHub.json
│   └── BadgeNFT.json
├── controllers/           # Route controllers
│   ├── authController.js
│   ├── jobController.js
│   └── ...
├── middlewares/           # Custom middleware
│   ├── auth.js            # Auth middleware
│   ├── error.js           # Error handling
│   └── validation.js      # Request validation
├── models/                # Database models
│   ├── Job.js
│   ├── Transaction.js
│   ├── User.js
│   └── Vehicle.js
├── services/              # Business logic
│   ├── blockchain.js      # Blockchain integration
│   ├── geocoding.js       # Geocoding service
│   ├── pricing.js         # Pricing calculator
│   └── push.js            # Push notifications
├── utils/                 # Utility functions
│   ├── logger.js          # Logging utility
│   └── validators.js      # Validation helpers
├── .env                   # Environment variables
├── index.js               # Server entry point
├── package.json           # Dependencies and scripts
└── README.md              # This documentation
```

## Blockchain Integration

HaulHub uses blockchain technology for secure, transparent transactions and record-keeping. Key features include:

- **Smart Contracts**: Deployed on Polygon for lower gas fees
- **Escrow System**: Secure payment handling
- **NFT Badges**: Reputation system for haulers
- **On-chain Records**: Immutable job history

### Smart Contracts

The platform uses two main smart contracts:
- `HaulHub.sol`: Main contract handling jobs and payments
- `BadgeNFT.sol`: NFT contract for hauler reputation badges

## Testing

Run the test suite with:
```bash
npm test
```

For development with watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Deployment

For production deployment:

1. Update environment variables for production
2. Build and deploy:
   ```bash
   npm start
   ```

## License

[MIT](LICENSE)

## Contact

For support or inquiries, contact the HaulHub team at support@haulhub.com