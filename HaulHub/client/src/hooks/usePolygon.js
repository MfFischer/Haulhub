import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { 
  initWeb3, 
  getCurrentAccount, 
  getNetworkInfo, 
  switchNetwork, 
  NETWORK_IDS 
} from '../utils/web3';

/**
 * Custom hook for interacting with the Polygon blockchain
 * Handles wallet connection, network switching, and basic state management
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Whether to connect automatically on mount (default: false)
 * @param {boolean} options.requireMainnet - Whether to require Polygon mainnet (default: false)
 * @param {boolean} options.watchNetwork - Whether to watch for network changes (default: true)
 * @param {boolean} options.watchAccount - Whether to watch for account changes (default: true)
 * @returns {Object} Polygon connection methods and state
 */
const usePolygon = (options = {}) => {
  const { 
    autoConnect = false,
    requireMainnet = false,
    watchNetwork = true,
    watchAccount = true
  } = options;
  
  const [web3, setWeb3] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState(null);
  const [error, setError] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  /**
   * Initialize Web3 and connect to wallet
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Initialize Web3
      const { web3: web3Instance, providerType } = await initWeb3();
      setWeb3(web3Instance);
      
      // Get current account
      const currentAccount = await getCurrentAccount(web3Instance);
      setAccount(currentAccount);
      
      // Get network information
      const { networkId, networkName: name } = await getNetworkInfo(web3Instance);
      setChainId(networkId);
      setNetworkName(name);
      
      // Check if we're on the correct network
      const targetNetwork = requireMainnet ? NETWORK_IDS.POLYGON : NETWORK_IDS.MUMBAI;
      const isCorrect = networkId === targetNetwork;
      setIsCorrectNetwork(isCorrect);
      
      // If we require a specific network and we're not on it, try to switch
      if (requireMainnet && !isCorrect) {
        try {
          await switchNetwork(targetNetwork);
          const { networkId: newNetworkId, networkName: newName } = await getNetworkInfo(web3Instance);
          setChainId(newNetworkId);
          setNetworkName(newName);
          setIsCorrectNetwork(newNetworkId === targetNetwork);
        } catch (switchError) {
          console.warn('Failed to switch network automatically:', switchError);
          // Don't treat this as a fatal error, let the user handle it
        }
      }
      
      setIsConnected(true);
      setIsConnecting(false);
      
      return {
        web3: web3Instance,
        account: currentAccount,
        chainId: networkId,
        networkName: name,
        isCorrectNetwork: isCorrect
      };
    } catch (error) {
      console.error('Error connecting to Polygon:', error);
      setError(error.message || 'Failed to connect to Polygon network');
      setIsConnecting(false);
      setIsConnected(false);
      throw error;
    }
  }, [requireMainnet]);
  
  /**
   * Disconnect from wallet
   */
  const disconnect = useCallback(() => {
    setWeb3(null);
    setAccount(null);
    setChainId(null);
    setNetworkName(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setError(null);
  }, []);
  
  /**
   * Switch to the correct network
   */
  const switchToCorrectNetwork = useCallback(async () => {
    if (!web3) return false;
    
    try {
      const targetNetwork = requireMainnet ? NETWORK_IDS.POLYGON : NETWORK_IDS.MUMBAI;
      await switchNetwork(targetNetwork);
      
      // Update network information
      const { networkId, networkName: name } = await getNetworkInfo(web3);
      setChainId(networkId);
      setNetworkName(name);
      setIsCorrectNetwork(networkId === targetNetwork);
      
      return networkId === targetNetwork;
    } catch (error) {
      console.error('Error switching network:', error);
      setError(`Failed to switch network: ${error.message}`);
      return false;
    }
  }, [web3, requireMainnet]);
  
  /**
   * Handle account changes from wallet
   */
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnect();
    } else if (accounts[0] !== account) {
      // User switched accounts
      setAccount(accounts[0]);
    }
  }, [account, disconnect]);
  
  /**
   * Handle network/chain changes from wallet
   */
  const handleChainChanged = useCallback(async () => {
    if (!web3) return;
    
    try {
      // Update network information
      const { networkId, networkName: name } = await getNetworkInfo(web3);
      setChainId(networkId);
      setNetworkName(name);
      
      // Check if we're on the correct network
      const targetNetwork = requireMainnet ? NETWORK_IDS.POLYGON : NETWORK_IDS.MUMBAI;
      setIsCorrectNetwork(networkId === targetNetwork);
    } catch (error) {
      console.error('Error handling chain change:', error);
    }
  }, [web3, requireMainnet]);
  
  // Connect automatically if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect().catch(error => {
        console.warn('Auto-connect failed:', error);
      });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);
  
  // Set up event listeners for account and network changes
  useEffect(() => {
    if (!web3 || !watchAccount && !watchNetwork) return;
    
    const ethereum = window.ethereum;
    if (!ethereum) return;
    
    if (watchAccount) {
      ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    if (watchNetwork) {
      ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (watchAccount) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      
      if (watchNetwork) {
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [web3, watchAccount, watchNetwork, handleAccountsChanged, handleChainChanged]);
  
  // Get transaction receipt
  const getTransactionReceipt = useCallback(async (txHash) => {
    if (!web3 || !txHash) return null;
    
    try {
      return await web3.eth.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }, [web3]);
  
  // Wait for transaction to be mined
  const waitForTransaction = useCallback(async (txHash, pollInterval = 1000, timeout = 60000) => {
    if (!web3 || !txHash) return null;
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkReceipt = async () => {
        try {
          const receipt = await web3.eth.getTransactionReceipt(txHash);
          
          if (receipt) {
            // Transaction was mined
            resolve(receipt);
            return;
          }
          
          // Check for timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Transaction ${txHash} timed out`));
            return;
          }
          
          // Continue polling
          setTimeout(checkReceipt, pollInterval);
        } catch (error) {
          reject(error);
        }
      };
      
      checkReceipt();
    });
  }, [web3]);
  
  return {
    web3,
    account,
    chainId,
    networkName,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    error,
    connect,
    disconnect,
    switchToCorrectNetwork,
    getTransactionReceipt,
    waitForTransaction
  };
};

export default usePolygon;
