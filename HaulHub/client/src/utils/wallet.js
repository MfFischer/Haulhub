import { initMetaMaskSDK, connectMetaMask, switchNetwork, signMessage } from './metamaskService';
import { ethers } from 'ethers';

export class WalletService {
  constructor() {
    this.sdk = null;
    this.provider = null;
    this.signer = null;
  }

  async initialize() {
    this.sdk = await initMetaMaskSDK();
    this.provider = new ethers.providers.Web3Provider(this.sdk.getProvider());
    this.signer = this.provider.getSigner();
  }

  async connect() {
    const address = await connectMetaMask();
    return address;
  }

  async switchNetwork(chainId) {
    return await switchNetwork(chainId);
  }

  async signMessage(message, address) {
    return await signMessage(message, address);
  }
}
