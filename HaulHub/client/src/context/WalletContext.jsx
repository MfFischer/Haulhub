import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import api from '../utils/api';

// Smart contract ABIs
import HaulHubABI from '../contracts/HaulHub.json';
import BadgeNFTABI from '../contracts/BadgeNFT.json';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState({
    eth: '0',
    usdc: '0',
    matic: '0'
  });
  
  // Contract instances
  const [haulHubContract, setHaulHubContract] = useState(null);
  const [badgeContract, setBadgeContract] = useState(null);
  
  // Contract addresses from environment variables
  const haulHubAddress = process.env.REACT_APP_HAULHUB_CONTRACT;
  const badgeAddress = process.env.REACT_APP_BADGE_CONTRACT;
  const usdcAddress = process.env.REACT_APP_USDC_CONTRACT;
  
  // Expected chain ID (80001 for Mumbai testnet, 137 for Polygon mainnet)
  const requiredChainId = parseInt(process.env.REACT_APP_CHAIN_ID || '80001');

  // Initialize provider and check for existing connection
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Check if wallet is already connected
        if (window.ethereum) {
          const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(ethProvider);
          
          // Check if already connected
          const accounts = await ethProvider.listAccounts();
          if (accounts.length > 0) {
            const ethSigner = ethProvider.getSigner();
            setSigner(ethSigner);
            setAccount(accounts[0]);
            
            const network = await ethProvider.getNetwork();
            setChainId(network.chainId);
            
            setIsConnected(true);
            
            // Initialize contracts
            if (haulHubAddress && badgeAddress) {
              initializeContracts(ethProvider, ethSigner);
            }
            
            // Update balances
            updateBalances(accounts[0], ethProvider);
          }
        }
      } catch (error) {
        console.error('Wallet initialization error:', error);
      }
    };

    initializeWallet();
  }, [haulHubAddress, badgeAddress]);

  // Listen for chain or account changes
  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet();
        } else if (accounts[0] !== account) {
          // Account changed
          setAccount(accounts[0]);
          if (provider) {
            const ethSigner = provider.getSigner();
            setSigner(ethSigner);
            updateBalances(accounts[0], provider);
            
            if (haulHubAddress && badgeAddress) {
              initializeContracts(provider, ethSigner);
            }
          }
        }
      };
      
      // Handle chain changes
      const handleChainChanged = (chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        
        // Reload the page as recommended by MetaMask
        window.location.reload();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Cleanup listeners
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account, provider, haulHubAddress, badgeAddress]);

  // Initialize contract instances
  const initializeContracts = useCallback((provider, signer) => {
    try {
      if (haulHubAddress) {
        const haulHub = new ethers.Contract(
          haulHubAddress,
          HaulHubABI.abi,
          provider
        );
        setHaulHubContract(haulHub.connect(signer));
      }
      
      if (badgeAddress) {
        const badge = new ethers.Contract(
          badgeAddress,
          BadgeNFTABI.abi,
          provider
        );
        setBadgeContract(badge.connect(signer));
      }
    } catch (error) {
      console.error('Contract initialization error:', error);
      toast.error('Failed to initialize blockchain contracts');
    }
  }, [haulHubAddress, badgeAddress]);

  // Update user's balances
  const updateBalances = useCallback(async (walletAddress, provider) => {
    try {
      // Get ETH/MATIC balance
      const ethBalance = await provider.getBalance(walletAddress);
      const formattedEth = ethers.utils.formatEther(ethBalance);
      
      // Get USDC balance (if address is defined)
      let usdcBalance = '0';
      if (usdcAddress) {
        // ERC20 interface for balanceOf
        const usdcContract = new ethers.Contract(
          usdcAddress,
          ['function balanceOf(address owner) view returns (uint256)'],
          provider
        );
        
        const balance = await usdcContract.balanceOf(walletAddress);
        usdcBalance = ethers.utils.formatUnits(balance, 6); // USDC has 6 decimals
      }
      
      setBalance({
        eth: formattedEth,
        usdc: usdcBalance,
        matic: formattedEth // ETH and MATIC are the same on Polygon
      });
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  }, [usdcAddress]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask to use this feature');
      return false;
    }
    
    setIsLoading(true);
    
    try {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length === 0) {
        toast.error('No accounts found. Please connect to MetaMask');
        return false;
      }
      
      const account = accounts[0];
      setAccount(account);
      
      // Get the network
      const network = await ethProvider.getNetwork();
      setChainId(network.chainId);
      
      // Check if on the correct network
      if (network.chainId !== requiredChainId) {
        const switched = await switchToRequiredNetwork();
        if (!switched) return false;
      }
      
      // Setup provider and signer
      setProvider(ethProvider);
      const ethSigner = ethProvider.getSigner();
      setSigner(ethSigner);
      
      // Initialize contracts
      if (haulHubAddress && badgeAddress) {
        initializeContracts(ethProvider, ethSigner);
      }
      
      // Update balances
      updateBalances(account, ethProvider);
      
      setIsConnected(true);
      toast.success('Wallet connected successfully');
      
      // Register wallet with backend
      try {
        await api.post('/users/wallet', { address: account });
      } catch (apiError) {
        console.error('Error registering wallet with backend:', apiError);
      }
      
      return true;
    } catch (error) {
      console.error('Connect wallet error:', error);
      const errorMessage = error.message || 'Failed to connect wallet';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [requiredChainId, haulHubAddress, badgeAddress, initializeContracts, updateBalances]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
    setHaulHubContract(null);
    setBadgeContract(null);
    
    toast.info('Wallet disconnected');
    return true;
  }, []);

  // Switch to the required network
  const switchToRequiredNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      let networkName, rpcUrl, blockExplorerUrl;
      
      // Define network parameters based on required chain ID
      if (requiredChainId === 80001) {
        // Mumbai testnet
        networkName = 'Mumbai';
        rpcUrl = 'https://rpc-mumbai.maticvigil.com';
        blockExplorerUrl = 'https://mumbai.polygonscan.com';
      } else if (requiredChainId === 137) {
        // Polygon mainnet
        networkName = 'Polygon';
        rpcUrl = 'https://polygon-rpc.com';
        blockExplorerUrl = 'https://polygonscan.com';
      } else {
        throw new Error('Unsupported network');
      }
      
      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${requiredChainId.toString(16)}` }]
        });
        return true;
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${requiredChainId.toString(16)}`,
                chainName: networkName,
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: [rpcUrl],
                blockExplorerUrls: [blockExplorerUrl]
              }
            ]
          });
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error(`Please switch to the ${requiredChainId === 80001 ? 'Mumbai Testnet' : 'Polygon Network'} manually in your wallet`);
      return false;
    }
  }, [requiredChainId]);

  // Create a new job with blockchain payment
  const createJob = useCallback(async (jobDetails, paymentAmount) => {
    if (!isConnected || !haulHubContract) {
      toast.error('Wallet not connected');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Convert MATIC amount to wei
      const paymentWei = ethers.utils.parseEther(paymentAmount.toString());
      
      // Call the contract's createJob function
      const tx = await haulHubContract.createJob(
        jobDetails.locationHash,
        jobDetails.isRush,
        { value: paymentWei }
      );
      
      // Wait for transaction to be mined
      toast.info('Transaction submitted. Waiting for confirmation...');
      const receipt = await tx.wait();
      
      // Find the JobCreated event
      const event = receipt.events.find(e => e.event === 'JobCreated');
      if (!event) {
        throw new Error('JobCreated event not found in transaction');
      }
      
      const jobId = event.args.jobId.toString();
      toast.success('Job created successfully on blockchain');
      
      // Update balances
      updateBalances(account, provider);
      
      return jobId;
    } catch (error) {
      console.error('Create job error:', error);
      const errorMessage = error.message || 'Failed to create job';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, haulHubContract, account, provider, updateBalances]);

  // Accept a job
  const acceptJob = useCallback(async (jobId) => {
    if (!isConnected || !haulHubContract) {
      toast.error('Wallet not connected');
      return false;
    }
    
    setIsLoading(true);
    
    try {
      const tx = await haulHubContract.acceptJob(jobId);
      
      toast.info('Accepting job. Waiting for confirmation...');
      await tx.wait();
      
      toast.success('Job accepted successfully');
      return true;
    } catch (error) {
      console.error('Accept job error:', error);
      const errorMessage = error.message || 'Failed to accept job';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, haulHubContract]);

  // Complete a job
  const completeJob = useCallback(async (jobId) => {
    if (!isConnected || !haulHubContract) {
      toast.error('Wallet not connected');
      return false;
    }
    
    setIsLoading(true);
    
    try {
      const tx = await haulHubContract.completeJob(jobId);
      
      toast.info('Completing job. Waiting for confirmation...');
      await tx.wait();
      
      toast.success('Job completed successfully. Payment received!');
      
      // Update balances
      updateBalances(account, provider);
      
      return true;
    } catch (error) {
      console.error('Complete job error:', error);
      const errorMessage = error.message || 'Failed to complete job';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, haulHubContract, account, provider, updateBalances]);

  // Get user's badges
  const getUserBadges = useCallback(async (userAddress) => {
    if (!badgeContract) {
      console.error('Badge contract not initialized');
      return [];
    }
    
    try {
      const address = userAddress || account;
      
      if (!address) {
        return [];
      }
      
      const badgeIds = await badgeContract.getUserBadges(address);
      
      // Get details for each badge
      const badges = await Promise.all(
        badgeIds.map(async (id) => {
          const badge = await badgeContract.getBadgeDetails(id);
          const uri = await badgeContract.tokenURI(id);
          
          // Try to fetch metadata
          let metadata = {};
          try {
            const response = await fetch(uri);
            metadata = await response.json();
          } catch (error) {
            console.error('Error fetching badge metadata:', error);
          }
          
          return {
            id: id.toString(),
            type: badge.badgeType,
            level: badge.level.toString(),
            issuedAt: new Date(badge.issuedAt.toNumber() * 1000).toISOString(),
            metadata
          };
        })
      );
      
      return badges;
    } catch (error) {
      console.error('Get user badges error:', error);
      return [];
    }
  }, [badgeContract, account]);

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        isConnected,
        isLoading,
        balance,
        haulHubContract,
        badgeContract,
        connectWallet,
        disconnectWallet,
        switchToRequiredNetwork,
        createJob,
        acceptJob,
        completeJob,
        getUserBadges,
        updateBalances
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
