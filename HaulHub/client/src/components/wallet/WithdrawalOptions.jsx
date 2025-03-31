import React, { useState } from 'react';
import { useContext } from 'react';
import { WalletContext } from '../../context/WalletContext';
import { toast } from 'react-toastify';
import { getStripe } from '../../utils/stripe';
import { getPayPal } from '../../utils/paypal';

const WithdrawalOptions = ({ onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('crypto');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { balance } = useContext(WalletContext);

  const handleCryptoWithdrawal = async () => {
    // Implement crypto withdrawal logic
    throw new Error('Crypto withdrawal not implemented');
  };

  const handlePayPalWithdrawal = async () => {
    // Implement PayPal withdrawal logic
    throw new Error('PayPal withdrawal not implemented');
  };

  const handleBankWithdrawal = async () => {
    // Implement bank withdrawal logic
    throw new Error('Bank withdrawal not implemented');
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      switch (selectedMethod) {
        case 'crypto':
          await handleCryptoWithdrawal();
          break;
        case 'paypal':
          await handlePayPalWithdrawal();
          break;
        case 'bank':
          await handleBankWithdrawal();
          break;
        default:
          throw new Error('Invalid withdrawal method');
      }
      onSuccess();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Withdrawal failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Withdraw Funds</h3>
      
      <form onSubmit={handleWithdrawal}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Withdrawal Method
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              className={`p-4 border rounded-lg ${
                selectedMethod === 'crypto' ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedMethod('crypto')}
            >
              <img src="/metamask-logo.svg" alt="MetaMask" className="h-8 mx-auto mb-2" />
              <span>Crypto Wallet</span>
            </button>
            
            <button
              type="button"
              className={`p-4 border rounded-lg ${
                selectedMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedMethod('paypal')}
            >
              <img src="/paypal-logo.svg" alt="PayPal" className="h-8 mx-auto mb-2" />
              <span>PayPal</span>
            </button>
            
            <button
              type="button"
              className={`p-4 border rounded-lg ${
                selectedMethod === 'bank' ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedMethod('bank')}
            >
              <img src="/bank-logo.svg" alt="Bank Transfer" className="h-8 mx-auto mb-2" />
              <span>Bank Transfer</span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Amount (Available: ${balance.toFixed(2)})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            min="0.01"
            max={balance}
            step="0.01"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={isLoading || !amount}
        >
          {isLoading ? 'Processing...' : 'Withdraw Funds'}
        </button>
      </form>
    </div>
  );
};

export default WithdrawalOptions;
