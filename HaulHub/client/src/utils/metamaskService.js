import { MetaMaskSDK, MetaMaskSDKOptions } from '@metamask/sdk';

// MetaMask SDK instance
let metamaskSDK;

/**
 * Initialize the MetaMask SDK
 * @param {Object} options - SDK configuration options
 * @returns {Promise<MetaMaskSDK>} The initialized SDK
 */
export const initMetaMaskSDK = async (options = {}) => {
  if (metamaskSDK) {
    return metamaskSDK;
  }

  const defaultOptions = {
    dappMetadata: {
      name: 'HaulHub',
      url: window.location.href,
      iconUrl: `${window.location.origin}/logo192.png`,
    },
    infuraAPIKey: process.env.REACT_APP_INFURA_API_KEY,
    // Enable this for desktop browsers
    useDeeplink: false,
    // Enable this for mobile browsers
    checkInstallationImmediately: true,
    // For mobile apps when using Expo/React Native
    // openDeeplinkHere: true,
  };

  const sdkOptions = { ...defaultOptions, ...options };
  
  metamaskSDK = new MetaMaskSDK(sdkOptions);

  try {
    await metamaskSDK.init();
    return metamaskSDK;
  } catch (error) {
    console.error('Failed to initialize MetaMask SDK:', error);
    throw error;
  }
};

/**
 * Connect to MetaMask
 * @returns {Promise<string>} The connected wallet address
 */
export const connectMetaMask = async () => {
  try {
    if (!metamaskSDK) {
      await initMetaMaskSDK();
    }

    // Get provider and ethereum object
    const provider = metamaskSDK.getProvider();
    const ethereum = metamaskSDK.getEthereum();

    if (!ethereum) {
      throw new Error('MetaMask is not available');
    }

    // Request accounts
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return accounts[0];
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    
    // Handle specific errors
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    } else if (error.message && error.message.includes('not available')) {
      throw new Error('MetaMask not installed. Please install MetaMask to use this feature.');
    }
    
    throw error;
  }
};

/**
 * Check if MetaMask is installed
 * @returns {Promise<boolean>} Whether MetaMask is installed
 */
export const isMetaMaskInstalled = async () => {
  try {
    if (!metamaskSDK) {
      await initMetaMaskSDK();
    }
    
    const ethereum = metamaskSDK.getEthereum();
    return Boolean(ethereum && ethereum.isMetaMask);
  } catch (error) {
    console.error('Error checking MetaMask installation:', error);
    return false;
  }
};

/**
 * Get the current connected accounts
 * @returns {Promise<string[]>} Array of connected accounts
 */
export const getConnectedAccounts = async () => {
  try {
    if (!metamaskSDK) {
      await initMetaMaskSDK();
    }
    
    const ethereum = metamaskSDK.getEthereum();
    if (!ethereum) {
      return [];
    }
    
    return await ethereum.request({ method: 'eth_accounts' });
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
};

/**
 * Get the current chain ID
 * @returns {Promise<string>} The chain ID in hex format
 */
export const getChainId = async () => {
  try {
    if (!metamaskSDK) {
      await initMetaMaskSDK();
    }
    
    const ethereum = metamaskSDK.getEthereum();
    if (!ethereum) {
      throw new Error('MetaMask is not available');
    }
    
    return await ethereum.request({ method: 'eth_chainId' });
  } catch (error) {
    console.error('Error getting chain ID:', error);
    throw error;
  }
};

/**
 * Sign a message with MetaMask
 * @param {string} message - Message to sign
 * @param {string} address - Signing address
 * @returns {Promise<string>} Signature
 */
export const signMessage = async (message, address) => {
  try {
    if (!metamaskSDK) {
      await initMetaMaskSDK();
    }
    
    const ethereum = metamaskSDK.getEthereum();
    if (!ethereum) {
      throw new Error('MetaMask is not available');
    }
    
    return await ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    });
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

/**
 * Switch to a specific network
 * @param {string} chainId - Chain ID in hex format
 * @returns {Promise<boolean>} Success status
 */
export const switchNetwork = async (chainId) => {
  try {
    if (!metamaskSDK) {
      await initMetaMaskSDK();
    }
    
    const ethereum = metamaskSDK.getEthereum();
    if (!ethereum) {
      throw new Error('MetaMask is not available');
    }
    
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }]
    });
    
    return true;
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      return false;
    }
    
    console.error('Error switching network:', error);
    throw error;
  }
};

/**
 * Add a new network to MetaMask
 * @param {Object} networkParams - Network parameters
 * @returns {Promise<boolean>} Success status
 */
export const addNetwork = async (networkParams) => {
  try {
    if (!metamaskSDK) {
      await initMetaMaskSDK();
    }
    
    const ethereum = metamaskSDK.getEthereum();
    if (!ethereum) {
      throw new Error('MetaMask is not available');
    }
    
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkParams]
    });
    
    return true;
  } catch (error) {
    console.error('Error adding network:', error);
    throw error;
  }
};

export default {
  initMetaMaskSDK,
  connectMetaMask,
  isMetaMaskInstalled,
  getConnectedAccounts,
  getChainId,
  signMessage,
  switchNetwork,
  addNetwork
};