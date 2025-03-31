HaulHub/
├── client/                           # Frontend (React)
│   ├── public/                       # Static assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── assets/                   # Images, fonts, etc.
│   │       ├── images/
│   │       └── icons/
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── common/               # General-purpose components
│   │   │   │   ├── Alert.jsx
│   │   │   │   ├── ErrorBadge.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   └── RoleToggle.jsx 
│   │   │   ├── forms/                # Form-related components
│   │   │   │   ├── JobForm.jsx
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── profile/              # Profile-related components
│   │   │   │   ├── BadgeDisplay.jsx
│   │   │   │   └── VehicleForm.jsx
│   │   │   ├── shared/               # Shared components used in multiple features
│   │   │   │   ├── JobCard.jsx
│   │   │   │   ├── JobStatusBadge.jsx
│   │   │   │   ├── JobTracker.jsx
│   │   │   │   └── MapView.jsx
│   │   │   └── wallet/               # Wallet-related components
│   │   │       ├── TransactionList.jsx
│   │   │       └── WithdrawalForm.jsx
│   │   ├── context/                  # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── LocationContext.jsx
│   │   │   └── WalletContext.jsx
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useJobsData.jsx
│   │   │   ├── useLocationTracker.js
│   │   │   └── usePolygon.js
│   │   ├── pages/                    # Page components
│   │   │   ├── CreateJob.jsx
│   │   │   ├── HaulerHome.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── JobDetail.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyJobs.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── PosterHome.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Wallet.jsx
│   │   ├── utils/                    # Utility functions
│   │   │   ├── api.js                # API client
│   │   │   ├── location.js           # Location utilities
│   │   │   ├── metamaskService.js
│   │   │   ├── pricing.js            # Pricing calculator
│   │   │   ├── format.js            # formatting values eg, dates and currency 
│   │   │   ├── validation.js         # Form validation
│   │   │   └── web3.js               # Blockchain utilities
│   │   ├── contracts/                # ABI for smart contracts
│   │   │   ├── HaulHub.json
│   │   │   └── BadgeNFT.json
│   │   ├── App.jsx                   # Main App component
│   │   ├── index.js                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── .env                          # Environment variables
│   ├── .env.development              # Dev environment variables
│   ├── .env.production               # Production environment variables
│   ├── package.json                  # Dependencies and scripts
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── postcss.config.js             # PostCSS configuration
│   └── README.md                     # Frontend documentation
│
├── server/                           # Backend (Node.js)
│   ├── api/                          # API routes
│   │   ├── auth.js                   # Authentication routes
│   │   ├── jobs.js                   # Job-related routes
│   │   ├── payments.js               # Payment routes
│   │   ├── location.js               # Location routes
│   │   └── users.js                  # User routes
│   ├── config/                       # Configuration files
│   │   ├── db.js                     # Database configuration
│   │   ├── redis.js                  # Redis configuration
│   │   └── passport.js               # Authentication configuration
│   ├── controllers/                  # Route controllers
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   ├── paymentController.js
│   │   ├── locationController.js
│   │   └── userController.js
│   ├── middlewares/                  # Custom middleware
│   │   ├── auth.js                   # Auth middleware
│   │   ├── error.js                  # Error handling
│   │   ├── rateLimiter.js            # Rate limiting
│   │   └── validation.js             # Request validation
│   ├── models/                       # Database models
│   │   ├── Job.js
│   │   ├── Transaction.js
│   │   ├── User.js
│   │   └── Vehicle.js
│   ├── services/                     # Business logic
│   │   ├── blockchain.js             # Blockchain integration
│   │   ├── geocoding.js              # Geocoding service
│   │   ├── pricing.js                # Pricing calculator
│   │   └── push.js                   # Push notifications
│   ├── utils/                        # Utility functions
│   │   ├── logger.js                 # Logging utility
│   │   ├── redis.js                  # Redis utility
│   │   └── validators.js             # Validation helpers
│   ├── uploads/                      # File upload directory
│   ├── logs/                         # Application logs
│   ├── index.js                      # Server entry point
│   ├── .env                          # Environment variables
│   ├── package.json                  # Dependencies and scripts
│   └── README.md                     # Backend documentation
│
├── contracts/                        # Smart contracts (Solidity)
│   ├── contracts/                    # Contract source files
│   │   ├── HaulHub.sol               # Main contract
│   │   ├── BadgeNFT.sol              # Badge NFT contract
│   │   └── DeliveryTracker.sol       # Delivery tracking contract
│   ├── scripts/                      # Deployment scripts
│   │   ├── export-abis.js            # Export ABIs script
│   │   └── deploy.js                 # Deployment script
│   ├── test/                         # Contract tests
│   │   ├── HaulHub.test.js
│   │   ├── DeliveryTracker.test.js
│   │   └── BadgeNFT.test.js
│   ├── artifacts/                    # Compiled contracts (generated)
│   ├── abis/                         # Contract ABIs (exported for frontend)
│   ├── .env                          # Environment variables for deployment
│   ├── hardhat.config.js             # Hardhat configuration
│   ├── package.json                  # Dependencies and scripts
│   └── README.md                     # Smart contract documentation
│
├── docker/                           # Docker configuration
│   ├── docker-compose.yml            # Docker Compose file
│   ├── Dockerfile.client             # Client Dockerfile
│   ├── Dockerfile.server             # Server Dockerfile
│   └── nginx/                        # Nginx configuration
│       ├── nginx.conf
│       └── default.conf
│
├── .github/                          # GitHub workflows
│   └── workflows/
│       ├── ci.yml                    # CI workflow
│       └── deploy.yml                # Deployment workflow
│
├── scripts/                          # Utility scripts
│   ├── setup.sh                      # Project setup script
│   └── deploy.sh                     # Deployment script
│
├── .gitignore                        # Git ignore file
├── .editorconfig                     # Editor configuration
├── .prettierrc                       # Prettier configuration
├── package.json                      # Root package.json for monorepo setup
└── README.md                         # Project documentation
