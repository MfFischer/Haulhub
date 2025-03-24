export class WalletError extends Error {
  constructor(code, message, originalError = null) {
    super(message);
    this.code = code;
    this.originalError = originalError;
  }
}

export const handleWalletError = (error) => {
  if (error.code === 4001) {
    return new WalletError('USER_REJECTED', 'User rejected the request');
  }
  if (error.code === 4902) {
    return new WalletError('NETWORK_NOT_FOUND', 'Network needs to be added');
  }
  // ... other specific error cases
};