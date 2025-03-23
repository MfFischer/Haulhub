const ethers = require('ethers');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Job = require('../models/Job');
require('dotenv').config();

// Load contract ABIs
const HaulHubABI = require('../contracts/HaulHub.json');
const BadgeNFTABI = require('../contracts/BadgeNFT.json');

// Contract addresses from environment
const HAULHUB_CONTRACT_ADDRESS = process.env.HAULHUB_CONTRACT_ADDRESS;
const BADGE_NFT_CONTRACT_ADDRESS = process.env.BADGE_NFT_CONTRACT_ADDRESS;
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;

// Provider configuration
const PROVIDER_URL = process.env.NODE_ENV === 'production'
  ? process.env.POLYGON_MAINNET_RPC_URL
  : process.env.POLYGON_MUMBAI_RPC_URL;

// Create provider instance
let provider;
let haulHubContract;
let badgeNFTContract;

/**
 * Initialize the blockchain service
 * @returns {Object} Provider and contract instances
 */
const initBlockchainService = async () => {
  try {
    // Initialize provider
    provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
    
    // Initialize wallet for signed transactions (optional)
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    let signer = null;
    
    if (adminPrivateKey) {
      signer = new ethers.Wallet(adminPrivateKey, provider);
      console.log('Admin wallet initialized with address:', signer.address);
    } else {
      console.log('No admin private key found, running in read-only mode');
    }
    
    // Initialize contracts
    if (HAULHUB_CONTRACT_ADDRESS) {
      haulHubContract = new ethers.Contract(
        HAULHUB_CONTRACT_ADDRESS,
        HaulHubABI.abi,
        signer || provider
      );
      console.log('HaulHub contract initialized at:', HAULHUB_CONTRACT_ADDRESS);
    }
    
    if (BADGE_NFT_CONTRACT_ADDRESS) {
      badgeNFTContract = new ethers.Contract(
        BADGE_NFT_CONTRACT_ADDRESS,
        BadgeNFTABI.abi,
        signer || provider
      );
      console.log('Badge NFT contract initialized at:', BADGE_NFT_CONTRACT_ADDRESS);
    }
    
    return {
      provider,
      haulHubContract,
      badgeNFTContract,
      signer
    };
  } catch (error) {
    console.error('Failed to initialize blockchain service:', error);
    throw error;
  }
};

/**
 * Create a new job on the blockchain
 * @param {Object} jobData - Job data with price, pickup, dropoff, etc.
 * @param {String} posterWalletAddress - Poster's wallet address
 * @returns {Object} - Transaction data and job ID
 */
const createJob = async (jobData, posterWalletAddress) => {
  try {
    if (!haulHubContract) {
      throw new Error('HaulHub contract not initialized');
    }
    
    // Prepare job data for the smart contract
    const locationHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['string', 'string'],
        [
          `${jobData.pickup.location.coordinates[1]},${jobData.pickup.location.coordinates[0]}`,
          `${jobData.dropoff.location.coordinates[1]},${jobData.dropoff.location.coordinates[0]}`
        ]
      )
    );
    
    // Convert payment amount to wei (assuming payment in MATIC)
    const paymentWei = ethers.utils.parseEther(jobData.payment.amount.toString());
    
    // Prepare transaction options
    const txOptions = {
      value: paymentWei,
      gasLimit: 500000 // Adjust as needed
    };
    
    // Call the contract's createJob function
    const tx = await haulHubContract.connect(
      new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
    ).createJob(
      locationHash,
      jobData.schedule.isRush,
      txOptions
    );
    
    console.log('Job creation transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Job creation transaction confirmed:', receipt.transactionHash);
    
    // Find the JobCreated event
    const event = receipt.events.find(e => e.event === 'JobCreated');
    if (!event) {
      throw new Error('JobCreated event not found in transaction');
    }
    
    // Get job ID from event
    const jobId = event.args.jobId.toString();
    
    return {
      jobId,
      blockchainJobId: jobId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      contractAddress: HAULHUB_CONTRACT_ADDRESS,
      events: receipt.events.map(e => ({
        name: e.event,
        args: e.args
      }))
    };
  } catch (error) {
    console.error('Blockchain job creation error:', error);
    throw error;
  }
};

/**
 * Accept a job on the blockchain
 * @param {String} jobId - Job ID on the blockchain
 * @param {String} haulerWalletAddress - Hauler's wallet address
 * @returns {Object} - Transaction data
 */
const acceptJob = async (jobId, haulerWalletAddress) => {
  try {
    if (!haulHubContract) {
      throw new Error('HaulHub contract not initialized');
    }
    
    // Call the contract's acceptJob function
    const tx = await haulHubContract.connect(
      new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
    ).acceptJob(jobId, {
      gasLimit: 300000 // Adjust as needed
    });
    
    console.log('Job acceptance transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Job acceptance transaction confirmed:', receipt.transactionHash);
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      events: receipt.events.map(e => ({
        name: e.event,
        args: e.args
      }))
    };
  } catch (error) {
    console.error('Blockchain job acceptance error:', error);
    throw error;
  }
};

/**
 * Complete a job on the blockchain
 * @param {String} jobId - Job ID on the blockchain
 * @param {String} haulerWalletAddress - Hauler's wallet address
 * @returns {Object} - Transaction data
 */
const completeJob = async (jobId, haulerWalletAddress) => {
  try {
    if (!haulHubContract) {
      throw new Error('HaulHub contract not initialized');
    }
    
    // Optional: Proof of delivery data (can be GPS coordinates, image hash, etc.)
    const proofData = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['string', 'uint256'],
        [`delivery-proof-${jobId}`, Date.now()]
      )
    );
    
    // Call the contract's completeJob function
    const tx = await haulHubContract.connect(
      new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
    ).completeJob(jobId, proofData, {
      gasLimit: 500000 // Adjust as needed
    });
    
    console.log('Job completion transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Job completion transaction confirmed:', receipt.transactionHash);
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      events: receipt.events.map(e => ({
        name: e.event,
        args: e.args
      }))
    };
  } catch (error) {
    console.error('Blockchain job completion error:', error);
    throw error;
  }
};

/**
 * Confirm job completion and release payment on the blockchain
 * @param {String} jobId - Job ID on the blockchain
 * @param {Number} rating - Rating for the hauler (1-5)
 * @param {String} posterWalletAddress - Poster's wallet address
 * @returns {Object} - Transaction data
 */
const confirmJobCompletion = async (jobId, rating, posterWalletAddress) => {
  try {
    if (!haulHubContract) {
      throw new Error('HaulHub contract not initialized');
    }
    
    // Call the contract's confirmJobCompletion function
    const tx = await haulHubContract.connect(
      new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
    ).confirmJobCompletion(jobId, rating, {
      gasLimit: 500000 // Adjust as needed
    });
    
    console.log('Job confirmation transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Job confirmation transaction confirmed:', receipt.transactionHash);
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      events: receipt.events.map(e => ({
        name: e.event,
        args: e.args
      }))
    };
  } catch (error) {
    console.error('Blockchain job confirmation error:', error);
    throw error;
  }
};

/**
 * Get user's balance from the blockchain
 * @param {String} walletAddress - User's wallet address
 * @returns {Object} - Balance data
 */
const getUserBalance = async (walletAddress) => {
  try {
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    
    // Get ETH/MATIC balance
    const ethBalance = await provider.getBalance(walletAddress);
    const formattedEth = ethers.utils.formatEther(ethBalance);
    
    // Get USDC balance if address is defined
    let usdcBalance = '0';
    if (USDC_CONTRACT_ADDRESS) {
      // ERC20 interface for balanceOf
      const usdcContract = new ethers.Contract(
        USDC_CONTRACT_ADDRESS,
        ['function balanceOf(address owner) view returns (uint256)'],
        provider
      );
      
      const balance = await usdcContract.balanceOf(walletAddress);
      usdcBalance = ethers.utils.formatUnits(balance, 6); // USDC has 6 decimals
    }
    
    return {
      matic: parseFloat(formattedEth),
      eth: parseFloat(formattedEth), // Same value as MATIC on Polygon
      usdc: parseFloat(usdcBalance)
    };
  } catch (error) {
    console.error('Blockchain balance check error:', error);
    throw error;
  }
};

/**
 * Withdraw funds from the contract to a user's wallet
 * @param {String} amount - Amount to withdraw (in MATIC)
 * @param {String} walletAddress - User's wallet address
 * @returns {Object} - Transaction data
 */
const withdrawFunds = async (amount, walletAddress) => {
  try {
    if (!haulHubContract) {
      throw new Error('HaulHub contract not initialized');
    }
    
    // Convert amount to wei
    const amountWei = ethers.utils.parseEther(amount.toString());
    
    // Call the contract's withdraw function
    const tx = await haulHubContract.connect(
      new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
    ).withdraw(amountWei, walletAddress, {
      gasLimit: 300000 // Adjust as needed
    });
    
    console.log('Withdrawal transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Withdrawal transaction confirmed:', receipt.transactionHash);
    
    // Create a transaction record in the database
    const transaction = new Transaction({
      userId: await User.findOne({ walletAddress }).select('_id'),
      type: 'withdrawal',
      amount: parseFloat(amount),
      status: 'completed',
      description: `Withdrawal of ${amount} MATIC to ${walletAddress}`,
      blockchain: {
        network: process.env.NODE_ENV === 'production' ? 'polygon' : 'mumbai',
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        contractAddress: HAULHUB_CONTRACT_ADDRESS
      },
      withdrawal: {
        walletAddress,
        processedAt: new Date()
      }
    });
    
    await transaction.save();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      amount,
      walletAddress,
      transactionId: transaction._id
    };
  } catch (error) {
    console.error('Blockchain withdrawal error:', error);
    throw error;
  }
};

/**
 * Issue a badge NFT to a user
 * @param {String} userId - User ID
 * @param {String} badgeType - Type of badge to issue
 * @param {Number} level - Badge level
 * @param {String} walletAddress - User's wallet address
 * @returns {Object} - Transaction data and badge ID
 */
const issueBadge = async (userId, badgeType, level, walletAddress) => {
  try {
    if (!badgeNFTContract) {
      throw new Error('Badge NFT contract not initialized');
    }
    
    // Call the contract's issueBadge function
    const tx = await badgeNFTContract.connect(
      new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
    ).issueBadge(walletAddress, badgeType, level, {
      gasLimit: 500000 // Adjust as needed
    });
    
    console.log('Badge issuance transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Badge issuance transaction confirmed:', receipt.transactionHash);
    
    // Find the BadgeIssued event
    const event = receipt.events.find(e => e.event === 'BadgeIssued');
    if (!event) {
      throw new Error('BadgeIssued event not found in transaction');
    }
    
    // Get badge ID from event
    const badgeId = event.args.tokenId.toString();
    
    return {
      badgeId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      badgeType,
      level,
      walletAddress
    };
  } catch (error) {
    console.error('Blockchain badge issuance error:', error);
    throw error;
  }
};

/**
 * Get current gas prices
 * @returns {Object} - Gas price data
 */
const getGasPrices = async () => {
  try {
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    
    // Get current gas price
    const gasPrice = await provider.getGasPrice();
    const gasPriceGwei = parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
    
    // Calculate slow, average, and fast gas prices
    return {
      slow: {
        gwei: (gasPriceGwei * 0.8).toFixed(2),
        price: (gasPriceGwei * 0.8 * 21000 / 1e9).toFixed(6) // Cost for standard tx
      },
      average: {
        gwei: gasPriceGwei.toFixed(2),
        price: (gasPriceGwei * 21000 / 1e9).toFixed(6)
      },
      fast: {
        gwei: (gasPriceGwei * 1.2).toFixed(2),
        price: (gasPriceGwei * 1.2 * 21000 / 1e9).toFixed(6)
      }
    };
  } catch (error) {
    console.error('Gas price check error:', error);
    throw error;
  }
};

/**
 * Listen for blockchain events
 * This could be used to update the database when events happen on-chain
 */
const setupEventListeners = async () => {
  try {
    if (!haulHubContract || !badgeNFTContract) {
      console.warn('Contracts not initialized, skipping event listeners');
      return;
    }
    
    // Listen for JobCreated events
    haulHubContract.on('JobCreated', async (jobId, poster, locationHash, isRush, value, event) => {
      console.log('JobCreated event detected:', jobId.toString());
      
      // You could update your database here
      try {
        await Job.findOneAndUpdate(
          { 'blockchain.jobId': jobId.toString() },
          { 
            'blockchain.transactions': [
              { 
                hash: event.transactionHash,
                description: 'Job created on blockchain',
                timestamp: new Date()
              }
            ]
          }
        );
      } catch (error) {
        console.error('Error processing JobCreated event:', error);
      }
    });
    
    // Listen for JobAccepted events
    haulHubContract.on('JobAccepted', async (jobId, hauler, event) => {
      console.log('JobAccepted event detected for job:', jobId.toString());
      
      // Update job in database
      try {
        await Job.findOneAndUpdate(
          { 'blockchain.jobId': jobId.toString() },
          { 
            $push: { 
              'blockchain.transactions': { 
                hash: event.transactionHash,
                description: 'Job accepted on blockchain',
                timestamp: new Date()
              }
            }
          }
        );
      } catch (error) {
        console.error('Error processing JobAccepted event:', error);
      }
    });
    
    // Add more event listeners as needed
    
    console.log('Blockchain event listeners set up');
  } catch (error) {
    console.error('Failed to set up event listeners:', error);
  }
};

module.exports = {
  initBlockchainService,
  createJob,
  acceptJob,
  completeJob,
  confirmJobCompletion,
  getUserBalance,
  withdrawFunds,
  issueBadge,
  getGasPrices,
  setupEventListeners,
  provider,
  haulHubContract,
  badgeNFTContract
};