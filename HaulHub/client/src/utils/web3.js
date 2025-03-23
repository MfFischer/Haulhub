/**
 * Web3 utility functions for HaulHub application
 * Handles blockchain operations, wallet connections, and smart contract interactions
 */

import Web3 from 'web3';
import HaulHubABI from '../contracts/HaulHub.json';
import BadgeNFTABI from '../contracts/BadgeNFT.json';

// Contract addresses (update these with your deployed contract addresses)
const HAULHUB_CONTRACT_ADDRESS = process.env.REACT_APP_HAULHUB_CONTRACT_ADDRESS;
const BADGE_NFT_CONTRACT_ADDRESS = process.env.REACT_APP_BADGE_NFT_CONTRACT_ADDRESS;

// Chain IDs for network identification
const NETWORK_IDS = {
  MAINNET: 1,
  GOERLI: 5,
  SEPOLIA: 11155111,
  POLYGON: 137,
  MUMBAI: 80001,
  LOCALHOST: 1337
};

/**
 * Initialize Web3 instance based on provider availability
 * @returns {Object} Web3 instance and provider type
 */
export const initWeb3 = async () => {
  let web3;
  let providerType = 'none';

  // Check for modern dapp browsers with ethereum provider
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    providerType = 'modern';
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error('User denied account access');
      throw new Error('Please connect your wallet to continue.');
    }
  } 
  // Check for legacy dapp browsers
  else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
    providerType = 'legacy';
  } 
  // Fallback to a read-only connection to the blockchain
  else {
    const provider = new Web3.providers.HttpProvider(
      process.env.REACT_APP_WEB3_PROVIDER_URL || 'https://polygon-mumbai.infura.io/v3/YOUR_INFURA_ID'
    );
    web3 = new Web3(provider);
    providerType = 'http';
  }

  return { web3, providerType };
};

/**
 * Get the current connected account
 * @param {Object} web3 - Web3 instance
 * @returns {string} Current account address
 */
export const getCurrentAccount = async (web3) => {
  try {
    const accounts = await web3.eth.getAccounts();
    return accounts[0];
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw new Error('Unable to get wallet accounts. Please check your wallet connection.');
  }
};

/**
 * Get the current network ID and name
 * @param {Object} web3 - Web3 instance
 * @returns {Object} Network ID and name
 */
export const getNetworkInfo = async (web3) => {
  try {
    const networkId = await web3.eth.net.getId();
    let networkName;

    switch (networkId) {
      case NETWORK_IDS.MAINNET:
        networkName = 'Ethereum Mainnet';
        break;
      case NETWORK_IDS.GOERLI:
        networkName = 'Goerli Testnet';
        break;
      case NETWORK_IDS.SEPOLIA:
        networkName = 'Sepolia Testnet';
        break;
      case NETWORK_IDS.POLYGON:
        networkName = 'Polygon Mainnet';
        break;
      case NETWORK_IDS.MUMBAI:
        networkName = 'Polygon Mumbai';
        break;
      case NETWORK_IDS.LOCALHOST:
        networkName = 'Local Development';
        break;
      default:
        networkName = 'Unknown Network';
    }

    return { networkId, networkName };
  } catch (error) {
    console.error('Error getting network:', error);
    throw new Error('Unable to detect blockchain network.');
  }
};

/**
 * Initialize HaulHub contract instance
 * @param {Object} web3 - Web3 instance
 * @returns {Object} Contract instance
 */
export const getHaulHubContract = (web3) => {
  try {
    return new web3.eth.Contract(
      HaulHubABI.abi,
      HAULHUB_CONTRACT_ADDRESS
    );
  } catch (error) {
    console.error('Error initializing HaulHub contract:', error);
    throw new Error('Unable to initialize contract. Please check your connection.');
  }
};

/**
 * Initialize Badge NFT contract instance
 * @param {Object} web3 - Web3 instance
 * @returns {Object} Contract instance
 */
export const getBadgeNFTContract = (web3) => {
  try {
    return new web3.eth.Contract(
      BadgeNFTABI.abi,
      BADGE_NFT_CONTRACT_ADDRESS
    );
  } catch (error) {
    console.error('Error initializing BadgeNFT contract:', error);
    throw new Error('Unable to initialize NFT contract. Please check your connection.');
  }
};

/**
 * Get ETH balance for an address
 * @param {Object} web3 - Web3 instance
 * @param {string} address - Wallet address
 * @returns {string} Balance in ETH
 */
export const getEthBalance = async (web3, address) => {
  try {
    const balanceWei = await web3.eth.getBalance(address);
    return web3.utils.fromWei(balanceWei, 'ether');
  } catch (error) {
    console.error('Error getting ETH balance:', error);
    throw new Error('Unable to fetch wallet balance.');
  }
};

/**
 * Get user's HaulHub token balance
 * @param {Object} web3 - Web3 instance
 * @param {string} address - Wallet address
 * @returns {string} Token balance
 */
export const getTokenBalance = async (web3, address) => {
  try {
    const contract = getHaulHubContract(web3);
    const balance = await contract.methods.balanceOf(address).call();
    return web3.utils.fromWei(balance, 'ether');
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
};

/**
 * Get user's badge NFTs
 * @param {Object} web3 - Web3 instance
 * @param {string} address - Wallet address
 * @returns {Array} Array of badge NFTs
 */
export const getUserBadges = async (web3, address) => {
  try {
    const contract = getBadgeNFTContract(web3);
    const balance = await contract.methods.balanceOf(address).call();
    
    const badges = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.methods.tokenOfOwnerByIndex(address, i).call();
      const tokenURI = await contract.methods.tokenURI(tokenId).call();
      
      // Fetch metadata from tokenURI if it's an HTTP URL
      let metadata = {};
      if (tokenURI.startsWith('http')) {
        try {
          const response = await fetch(tokenURI);
          metadata = await response.json();
        } catch (err) {
          console.error('Error fetching badge metadata:', err);
        }
      } else if (tokenURI.startsWith('data:application/json;base64,')) {
        // Handle base64 encoded JSON metadata
        const base64Data = tokenURI.replace('data:application/json;base64,', '');
        try {
          const jsonString = atob(base64Data);
          metadata = JSON.parse(jsonString);
        } catch (err) {
          console.error('Error parsing base64 metadata:', err);
        }
      }
      
      badges.push({
        tokenId,
        tokenURI,
        metadata
      });
    }
    
    return badges;
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
};

/**
 * Create a new job on the blockchain
 * @param {Object} web3 - Web3 instance
 * @param {Object} jobData - Job data to store
 * @param {string} fromAddress - Sender address
 * @returns {Object} Transaction receipt
 */
export const createJob = async (web3, jobData, fromAddress) => {
  try {
    const contract = getHaulHubContract(web3);
    
    // Convert job data to IPFS hash or JSON string
    const jobDataString = JSON.stringify(jobData);
    
    // Calculate the price in wei
    const priceWei = web3.utils.toWei(jobData.price.toString(), 'ether');
    
    // Create the job on-chain
    const tx = await contract.methods
      .createJob(jobDataString, priceWei)
      .send({ 
        from: fromAddress,
        value: priceWei // Send the payment with the transaction
      });
    
    return tx;
  } catch (error) {
    console.error('Error creating job on blockchain:', error);
    throw new Error('Failed to create job. Please try again.');
  }
};

/**
 * Accept a job (for haulers)
 * @param {Object} web3 - Web3 instance
 * @param {number} jobId - Job ID to accept
 * @param {string} fromAddress - Hauler's address
 * @returns {Object} Transaction receipt
 */
export const acceptJob = async (web3, jobId, fromAddress) => {
  try {
    const contract = getHaulHubContract(web3);
    
    const tx = await contract.methods
      .acceptJob(jobId)
      .send({ from: fromAddress });
    
    return tx;
  } catch (error) {
    console.error('Error accepting job:', error);
    throw new Error('Failed to accept job. Please try again.');
  }
};

/**
 * Complete a job (for haulers)
 * @param {Object} web3 - Web3 instance
 * @param {number} jobId - Job ID to complete
 * @param {string} proofData - Proof of delivery data
 * @param {string} fromAddress - Hauler's address
 * @returns {Object} Transaction receipt
 */
export const completeJob = async (web3, jobId, proofData, fromAddress) => {
  try {
    const contract = getHaulHubContract(web3);
    
    const tx = await contract.methods
      .completeJob(jobId, proofData)
      .send({ from: fromAddress });
    
    return tx;
  } catch (error) {
    console.error('Error completing job:', error);
    throw new Error('Failed to complete job. Please try again.');
  }
};

/**
 * Confirm job completion (for job posters)
 * @param {Object} web3 - Web3 instance
 * @param {number} jobId - Job ID to confirm
 * @param {number} rating - Rating for the hauler (1-5)
 * @param {string} fromAddress - Job poster's address
 * @returns {Object} Transaction receipt
 */
export const confirmJobCompletion = async (web3, jobId, rating, fromAddress) => {
  try {
    const contract = getHaulHubContract(web3);
    
    const tx = await contract.methods
      .confirmJobCompletion(jobId, rating)
      .send({ from: fromAddress });
    
    return tx;
  } catch (error) {
    console.error('Error confirming job completion:', error);
    throw new Error('Failed to confirm job completion. Please try again.');
  }
};

/**
 * Withdraw funds from the platform
 * @param {Object} web3 - Web3 instance
 * @param {string} amount - Amount to withdraw in ETH
 * @param {string} fromAddress - Withdrawer's address
 * @returns {Object} Transaction receipt
 */
export const withdrawFunds = async (web3, amount, fromAddress) => {
  try {
    const contract = getHaulHubContract(web3);
    const amountWei = web3.utils.toWei(amount.toString(), 'ether');
    
    const tx = await contract.methods
      .withdraw(amountWei)
      .send({ from: fromAddress });
    
    return tx;
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw new Error('Failed to withdraw funds. Please try again.');
  }
};

/**
 * Estimate gas for a transaction
 * @param {Object} web3 - Web3 instance
 * @param {Object} txObject - Transaction object
 * @returns {string} Estimated gas in ETH
 */
export const estimateGas = async (web3, txObject) => {
  try {
    const gasLimit = await web3.eth.estimateGas(txObject);
    const gasPrice = await web3.eth.getGasPrice();
    
    const gasCost = web3.utils.toBN(gasLimit).mul(web3.utils.toBN(gasPrice));
    return web3.utils.fromWei(gasCost, 'ether');
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw new Error('Failed to estimate transaction fee.');
  }
};

/**
 * Check if user wallet is connected
 * @returns {boolean} Whether wallet is connected
 */
export const isWalletConnected = async () => {
  try {
    if (!window.ethereum) {
      return false;
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

/**
 * Connect user wallet
 * @returns {string} Connected wallet address
 */
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet detected. Please install MetaMask or another wallet.');
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw new Error('Failed to connect wallet. Please try again.');
  }
};

/**
 * Listen for account changes
 * @param {Function} callback - Function to call when accounts change
 * @returns {Function} Function to remove the listener
 */
export const onAccountsChanged = (callback) => {
  if (!window.ethereum) {
    return () => {};
  }
  
  const handleAccountsChanged = (accounts) => {
    callback(accounts);
  };
  
  window.ethereum.on('accountsChanged', handleAccountsChanged);
  
  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
  };
};

/**
 * Listen for network changes
 * @param {Function} callback - Function to call when network changes
 * @returns {Function} Function to remove the listener
 */
export const onNetworkChanged = (callback) => {
  if (!window.ethereum) {
    return () => {};
  }
  
  const handleChainChanged = (chainId) => {
    callback(parseInt(chainId, 16));
  };
  
  window.ethereum.on('chainChanged', handleChainChanged);
  
  return () => {
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  };
};

/**
 * Sign a message with the user's wallet
 * @param {Object} web3 - Web3 instance
 * @param {string} message - Message to sign
 * @param {string} address - Signer's address
 * @returns {string} Signature
 */
export const signMessage = async (web3, message, address) => {
  try {
    const signature = await web3.eth.personal.sign(
      message,
      address,
      '' // Password (empty for MetaMask)
    );
    
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message. Please try again.');
  }
};

/**
 * Verify a signed message
 * @param {Object} web3 - Web3 instance
 * @param {string} message - Original message
 * @param {string} signature - Message signature
 * @returns {string} Signer's address
 */
export const verifySignature = (web3, message, signature) => {
  try {
    const signerAddress = web3.eth.accounts.recover(message, signature);
    return signerAddress;
  } catch (error) {
    console.error('Error verifying signature:', error);
    throw new Error('Failed to verify signature.');
  }
};

/**
 * Switch to a specific blockchain network
 * @param {number} chainId - Network chain ID to switch to
 * @returns {boolean} Success status
 */
export const switchNetwork = async (chainId) => {
  try {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet detected.');
    }
    
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
    
    return true;
  } catch (error) {
    // If the chain is not added to MetaMask
    if (error.code === 4902) {
      // Add the network (customize based on your needs)
      try {
        if (chainId === NETWORK_IDS.MUMBAI) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${NETWORK_IDS.MUMBAI.toString(16)}`,
              chainName: 'Polygon Mumbai Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/']
            }]
          });
          return true;
        } else if (chainId === NETWORK_IDS.POLYGON) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${NETWORK_IDS.POLYGON.toString(16)}`,
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com/']
            }]
          });
          return true;
        } else {
          throw new Error('Unsupported network');
        }
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw new Error('Failed to add network to wallet.');
      }
    }
    
    console.error('Error switching network:', error);
    throw new Error('Failed to switch network. Please try manually from your wallet.');
  }
};

export default {
  initWeb3,
  getCurrentAccount,
  getNetworkInfo,
  getHaulHubContract,
  getBadgeNFTContract,
  getEthBalance,
  getTokenBalance,
  getUserBadges,
  createJob,
  acceptJob,
  completeJob,
  confirmJobCompletion,
  withdrawFunds,
  estimateGas,
  isWalletConnected,
  connectWallet,
  onAccountsChanged,
  onNetworkChanged,
  signMessage,
  verifySignature,
  switchNetwork,
  NETWORK_IDS
};