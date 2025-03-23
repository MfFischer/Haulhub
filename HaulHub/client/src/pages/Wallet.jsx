import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import WalletContext from '../context/WalletContext';
import AuthContext from '../context/AuthContext';
import LocationContext from '../context/LocationContext';
import Loading from '../components/common/Loading';
import api from '../utils/api';

// Mock transaction history (in a real app, would come from API)
const DEFAULT_TRANSACTIONS = [
  {
    id: 't1',
    type: 'payment',
    amount: 8.50,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'completed',
    jobId: 'j1',
    description: 'Payment for laptop delivery'
  },
  {
    id: 't2',
    type: 'tip',
    amount: 2.00,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    status: 'completed',
    jobId: 'j2',
    description: 'Tip for quick delivery'
  },
  {
    id: 't3',
    type: 'withdrawal',
    amount: 20.00,
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    status: 'completed',
    description: 'Withdrawal to bank account'
  }
];

const Wallet = () => {
  const [transactions, setTransactions] = useState([]);
  const [earningStats, setEarningStats] = useState({
    totalEarned: 0,
    pendingPayment: 0,
    weeklyEarnings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { isConnected, account, balance, connectWallet, updateBalances } = useContext(WalletContext);
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const { userRegion } = useContext(LocationContext);
  
  const navigate = useNavigate();
  
  // Check authentication and load data
  useEffect(() => {
    if (!isAuthenticated) {
      toast.warn('Please log in to access your wallet');
      navigate('/login', { state: { returnUrl: '/wallet' } });
      return;
    }
    
    // Load transaction history and stats
    const fetchWalletData = async () => {
      setIsLoading(true);
      try {
        // In a real app, fetch from API
        // const response = await api.get('/wallet/transactions');
        // setTransactions(response.data.transactions);
        // setEarningStats(response.data.stats);
        
        // For demo, use mock data
        setTimeout(() => {
          setTransactions(DEFAULT_TRANSACTIONS);
          setEarningStats({
            totalEarned: 85.50,
            pendingPayment: 12.00,
            weeklyEarnings: 32.50
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast.error('Failed to load wallet data');
        setIsLoading(false);
      }
    };
    
    fetchWalletData();
  }, [isAuthenticated, navigate]);
  
  // Connect wallet if not already connected
  const handleConnectWallet = async () => {
    try {
      const success = await connectWallet();
      if (success) {
        toast.success('Wallet connected successfully');
        
        // Register wallet with backend
        try {
          await api.post('/users/wallet', { address: account });
        } catch (apiError) {
          console.error('Error registering wallet with backend:', apiError);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };
  
  // Handle withdrawal submission
  const handleWithdrawal = async (e) => {
    e.preventDefault();
    
    if (!withdrawalAmount || isNaN(parseFloat(withdrawalAmount)) || parseFloat(withdrawalAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const amount = parseFloat(withdrawalAmount);
    
    // Check if amount is greater than balance
    if (amount > (parseFloat(balance.matic) * 0.95)) { // 5% buffer for gas fees
      toast.error('Insufficient balance for withdrawal');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real app, call API endpoint
      // await api.post('/wallet/withdraw', {
      //   amount,
      //   method: withdrawalMethod
      // });
      
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Withdrawal of ${amount} USDC initiated`);
      
      // Add to transactions
      setTransactions(prev => [{
        id: `t${Date.now()}`,
        type: 'withdrawal',
        amount,
        timestamp: new Date().toISOString(),
        status: 'pending',
        description: `Withdrawal to ${withdrawalMethod === 'bank' ? 'bank account' : 'PayPal'}`
      }, ...prev]);
      
      // Reset form
      setWithdrawalAmount('');
      setShowWithdrawalForm(false);
      
      // Refresh balances
      if (isConnected && account) {
        updateBalances(account);
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get currency symbol
  const getCurrencySymbol = () => {
    const symbols = {
      'us': '$',
      'ph': '₱',
      'id': 'Rp',
      'vn': '₫',
      'eu': '€',
      'uk': '£',
      'ca': 'C$'
    };
    return symbols[userRegion] || '$';
  };
  
  // Display loading state
  if (isLoading) {
    return <Loading message="Loading wallet information..." />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h1>
          
          {/* Wallet Balance */}
          <div className="bg-gray-800 text-white rounded-lg mb-6 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Your Balance</h2>
              
              {isConnected ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">MATIC Balance</div>
                    <div className="text-2xl font-bold">{parseFloat(balance.matic).toFixed(4)}</div>
                    <div className="text-xs text-gray-400 mt-1">Polygon Network</div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">USDC Balance</div>
                    <div className="text-2xl font-bold">{parseFloat(balance.usdc).toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-1">Stablecoin</div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Wallet Address</div>
                    <div className="text-sm font-medium truncate">{account}</div>
                    <div className="text-xs text-gray-400 mt-1">Polygon Network</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 p-6 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">
                    Connect your wallet to view your crypto balance and enable crypto payments.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Earnings Summary */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Earnings Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="text-sm text-gray-600 mb-1">Total Earned</div>
                <div className="text-2xl font-bold text-gray-900">
                  {getCurrencySymbol()}{earningStats.totalEarned.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Lifetime earnings</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">Pending Payment</div>
                <div className="text-2xl font-bold text-gray-900">
                  {getCurrencySymbol()}{earningStats.pendingPayment.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">In active jobs</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="text-sm text-gray-600 mb-1">This Week</div>
                <div className="text-2xl font-bold text-gray-900">
                  {getCurrencySymbol()}{earningStats.weeklyEarnings.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
              </div>
            </div>
          </div>
          
          {/* Withdrawal Section */}
          {isConnected && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Withdraw Funds</h2>
                {!showWithdrawalForm && (
                  <button
                    onClick={() => setShowWithdrawalForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm transition-colors"
                  >
                    New Withdrawal
                  </button>
                )}
              </div>
              
              {showWithdrawalForm ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <form onSubmit={handleWithdrawal}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                          Amount (USDC)
                        </label>
                        <input
                          type="number"
                          id="amount"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          step="0.01"
                          min="1"
                          max={parseFloat(balance.usdc) || 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {parseFloat(balance.usdc).toFixed(2)} USDC
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
                          Withdrawal Method
                        </label>
                        <select
                          id="method"
                          value={withdrawalMethod}
                          onChange={(e) => setWithdrawalMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="bank">Bank Account</option>
                          <option value="paypal">PayPal</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowWithdrawalForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          'Withdraw Funds'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
            </div>
          )}
          
          {/* Transaction History */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h2>
            
            {transactions.length === 0 ? (
              <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
                <p className="text-gray-600">No transactions yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'payment' 
                              ? 'bg-green-100 text-green-800'
                              : transaction.type === 'tip'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.type === 'payment' 
                              ? 'Payment' 
                              : transaction.type === 'tip' 
                              ? 'Tip' 
                              : 'Withdrawal'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            transaction.type === 'withdrawal'
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}>
                            {transaction.type === 'withdrawal' ? '-' : '+'}
                            {getCurrencySymbol()}{transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.description}
                          {transaction.jobId && (
                            <button
                              onClick={() => navigate(`/jobs/${transaction.jobId}`)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              View Job
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;