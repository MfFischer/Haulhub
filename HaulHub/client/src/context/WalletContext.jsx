import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import HaulHubABI from '../contracts/HaulHub.json';
import BadgeNFTABI from '../contracts/BadgeNFT.json';

export const WalletContext = createContext();

// Contract addresses - update these with your deployed contract addresses
const HAULHUB_CONTRACT_ADDRESS = process.env.REACT_APP_HAULHUB_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const BADGE_NFT_CONTRACT_ADDRESS = process.env.REACT_APP_BADGE_NFT_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState({ matic: '0' });
  const [contracts, setContracts] = useState({
    haulHub: null,
    badgeNFT: null
  });

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);
        setIsConnected(true);
        await updateBalance(accounts[0]);
        await initializeContracts();
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const updateBalance = async (address) => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      setBalance({
        matic: ethers.utils.formatEther(balance)
      });
    }
  };

  const initializeContracts = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        const haulHubContract = new ethers.Contract(
          HAULHUB_CONTRACT_ADDRESS,
          HaulHubABI.abi,
          signer
        );
        
        const badgeNFTContract = new ethers.Contract(
          BADGE_NFT_CONTRACT_ADDRESS,
          BadgeNFTABI.abi,
          signer
        );
        
        setContracts({
          haulHub: haulHubContract,
          badgeNFT: badgeNFTContract
        });
        
        console.log("Contracts initialized successfully");
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    }
  };

  // Function to accept a job through the blockchain
  const acceptJob = async (jobId) => {
    try {
      // Check if wallet is connected
      if (!isConnected) {
        console.log("Wallet not connected, attempting to connect...");
        await connectWallet();
      }
      
      // Check if contracts are initialized
      if (!contracts.haulHub) {
        console.log("Contracts not initialized, initializing...");
        await initializeContracts();
      }
      
      // For development environment, simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log(`DEV MODE: Simulating blockchain job acceptance for job ID ${jobId}`);
        return true;
      }
      
      if (contracts.haulHub) {
        const tx = await contracts.haulHub.acceptJob(jobId);
        await tx.wait();
        console.log(`Job ${jobId} accepted on blockchain`);
        return true;
      } else {
        console.error("HaulHub contract not initialized");
        return false;
      }
    } catch (error) {
      console.error(`Error accepting job ${jobId}:`, error);
      return false;
    }
  };

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            await updateBalance(accounts[0]);
            await initializeContracts();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        account,
        balance,
        connectWallet,
        updateBalance,
        acceptJob,  // Add the acceptJob function to the context value
        contracts
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Export both the context and the provider
export default WalletContext;