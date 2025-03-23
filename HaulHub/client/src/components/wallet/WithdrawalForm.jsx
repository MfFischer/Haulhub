import React, { useState, useContext, useEffect } from 'react';
import { WalletContext } from '../../context/WalletContext';
import { validateWithdrawalForm } from '../../utils/validation';
import { formatCurrency, formatCrypto } from '../../utils/format';

const WithdrawalForm = () => {
  const { balance, withdraw, getGasEstimate, recentAddresses = [] } = useContext(WalletContext);
  
  const [formData, setFormData] = useState({
    amount: '',
    walletAddress: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalFee, setWithdrawalFee] = useState(0);
  const [showRecentAddresses, setShowRecentAddresses] = useState(false);
  
  useEffect(() => {
    const updateGasEstimate = async () => {
      if (formData.walletAddress && formData.amount && !isNaN(parseFloat(formData.amount))) {
        try {
          const fee = await getGasEstimate(formData.walletAddress, parseFloat(formData.amount));
          setWithdrawalFee(fee);
        } catch (error) {
          console.error('Failed to estimate gas:', error);
          setWithdrawalFee(0);
        }
      } else {
        setWithdrawalFee(0);
      }
    };
    
    // Debounce the gas estimate update
    const handler = setTimeout(() => {
      updateGasEstimate();
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [formData.walletAddress, formData.amount, getGasEstimate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const handleSelectRecentAddress = (address) => {
    setFormData({
      ...formData,
      walletAddress: address
    });
    setShowRecentAddresses(false);
    
    // Clear any wallet address error
    if (errors.walletAddress) {
      setErrors({
        ...errors,
        walletAddress: null
      });
    }
  };
  
  const handleMaxAmount = () => {
    // Set the maximum amount (balance minus fee)
    const maxAmount = Math.max(0, balance - withdrawalFee).toFixed(6);
    setFormData({
      ...formData,
      amount: maxAmount
    });
    
    // Clear any amount error
    if (errors.amount) {
      setErrors({
        ...errors,
        amount: null
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form inputs
    const validationErrors = validateWithdrawalForm({
      ...formData,
      availableBalance: balance - withdrawalFee
    });
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Perform the withdrawal
      const txHash = await withdraw(formData.walletAddress, parseFloat(formData.amount), formData.notes);
      
      // Show success message or redirect
      console.log('Withdrawal successful:', txHash);
      
      // Reset the form
      setFormData({
        amount: '',
        walletAddress: '',
        notes: ''
      });
      
      // Show success alert (implement this based on your UI approach)
      alert(`Withdrawal successful! Transaction hash: ${txHash}`);
    } catch (error) {
      // Handle withdrawal error
      setErrors({
        general: error.message || 'Withdrawal failed. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getAmountWithFee = () => {
    const amount = parseFloat(formData.amount) || 0;
    return Math.max(0, amount - withdrawalFee);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Withdraw Funds</h3>
      
      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Available Balance</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(balance)}</span>
        </div>
      </div>
      
      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Amount to Withdraw
          </label>
          <div className="flex">
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.000001"
              min="0"
              className={`shadow appearance-none border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
            />
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-r"
              onClick={handleMaxAmount}
            >
              Max
            </button>
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          
          {withdrawalFee > 0 && (
            <div className="mt-2 text-sm">
              <p className="text-gray-600">Estimated network fee: {formatCrypto(withdrawalFee)}</p>
              <p className="text-gray-600">You will receive: {formatCrypto(getAmountWithFee())}</p>
            </div>
          )}
        </div>
        
        <div className="mb-4 relative">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="walletAddress">
            Destination Wallet Address
          </label>
          <div className="flex">
            <input
              id="walletAddress"
              name="walletAddress"
              type="text"
              className={`shadow appearance-none border ${errors.walletAddress ? 'border-red-500' : 'border-gray-300'} rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              placeholder="0x..."
              value={formData.walletAddress}
              onChange={handleChange}
              onFocus={() => recentAddresses.length > 0 && setShowRecentAddresses(true)}
              onBlur={() => setTimeout(() => setShowRecentAddresses(false), 200)}
            />
            {recentAddresses.length > 0 && (
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-r"
                onClick={() => setShowRecentAddresses(!showRecentAddresses)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {errors.walletAddress && <p className="text-red-500 text-xs mt-1">{errors.walletAddress}</p>}
          
          {/* Recent addresses dropdown */}
          {showRecentAddresses && recentAddresses.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
              <ul className="max-h-60 overflow-auto py-1">
                {recentAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleSelectRecentAddress(address)}
                  >
                    {address}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="2"
            className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Add a note to this transaction"
            value={formData.notes}
            onChange={handleChange}
          ></textarea>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <svg className="mt-0.5 mr-2 w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> Please double-check the wallet address. Transactions cannot be reversed once confirmed on the blockchain.
            </p>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Withdrawal...
            </span>
          ) : (
            'Withdraw Funds'
          )}
        </button>
      </form>
    </div>
  );
};

export default WithdrawalForm;