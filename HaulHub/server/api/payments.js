const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');

// In-memory storage for transactions
const transactions = [];

/**
 * @route   GET api/payments/balance
 * @desc    Get user's balance
 * @access  Private
 */
router.get('/balance', auth, (req, res) => {
  try {
    // In a real app, you'd query the blockchain or your database
    // This is a simplified example
    const userTransactions = transactions.filter(
      tx => tx.userId === req.user.id
    );
    
    let balance = 0;
    
    // Calculate balance from transactions
    userTransactions.forEach(tx => {
      if (tx.type === 'deposit' || tx.type === 'earnings') {
        balance += tx.amount;
      } else if (tx.type === 'withdrawal' || tx.type === 'payment') {
        balance -= tx.amount;
      }
    });
    
    res.json({ balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/payments/transactions
 * @desc    Get user's transaction history
 * @access  Private
 */
router.get('/transactions', auth, (req, res) => {
  try {
    // Filter by type if provided
    const { type, timeRange } = req.query;
    
    let userTransactions = transactions.filter(
      tx => tx.userId === req.user.id
    );
    
    // Filter by type
    if (type && type !== 'all') {
      userTransactions = userTransactions.filter(tx => tx.type === type);
    }
    
    // Filter by time range
    if (timeRange) {
      const now = Date.now();
      let timeFilter;
      
      switch (timeRange) {
        case 'week':
          timeFilter = now - 7 * 24 * 60 * 60 * 1000; // 7 days
          break;
        case 'month':
          timeFilter = now - 30 * 24 * 60 * 60 * 1000; // 30 days
          break;
        case 'year':
          timeFilter = now - 365 * 24 * 60 * 60 * 1000; // 365 days
          break;
      }
      
      if (timeFilter) {
        userTransactions = userTransactions.filter(
          tx => new Date(tx.timestamp) >= new Date(timeFilter)
        );
      }
    }
    
    // Sort by time, newest first
    userTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(userTransactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST api/payments/withdraw
 * @desc    Request a withdrawal
 * @access  Private
 */
router.post('/withdraw', [
  auth,
  check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0.01 }),
  check('walletAddress', 'Wallet address is required').isEthereumAddress(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { amount, walletAddress, notes } = req.body;
    
    // In a real app, you'd check if user has sufficient balance
    // and then process the withdrawal on the blockchain
    
    // Calculate balance
    const userTransactions = transactions.filter(
      tx => tx.userId === req.user.id
    );
    
    let balance = 0;
    userTransactions.forEach(tx => {
      if (tx.type === 'deposit' || tx.type === 'earnings') {
        balance += tx.amount;
      } else if (tx.type === 'withdrawal' || tx.type === 'payment') {
        balance -= tx.amount;
      }
    });
    
    // Check if user has sufficient balance
    if (balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Create a new withdrawal transaction
    const newTransaction = {
      id: Date.now().toString(),
      userId: req.user.id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      walletAddress,
      notes,
      status: 'pending',
      hash: null, // This would be the blockchain transaction hash
      timestamp: new Date(),
      description: `Withdrawal of ${amount} to ${walletAddress.substring(0, 8)}...`
    };
    
    transactions.push(newTransaction);
    
    // In a real app, you'd process the withdrawal on the blockchain here
    // and update the transaction with the hash and status
    
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST api/payments/deposit
 * @desc    Record a deposit (usually called after blockchain confirmation)
 * @access  Private (admin or system only in production)
 */
router.post('/deposit', [
  auth,
  check('userId', 'User ID is required').not().isEmpty(),
  check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0.01 }),
  check('hash', 'Transaction hash is required').not().isEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { userId, amount, hash, notes } = req.body;
    
    // Create a new deposit transaction
    const newTransaction = {
      id: Date.now().toString(),
      userId,
      type: 'deposit',
      amount: parseFloat(amount),
      hash,
      notes,
      status: 'completed',
      timestamp: new Date(),
      description: `Deposit of ${amount}`
    };
    
    transactions.push(newTransaction);
    
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST api/payments/job-payment
 * @desc    Process payment for a completed job
 * @access  Private (admin or system only in production)
 */
router.post('/job-payment', [
  auth,
  check('jobId', 'Job ID is required').not().isEmpty(),
  check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0.01 }),
  check('haulerId', 'Hauler ID is required').not().isEmpty(),
  check('posterId', 'Poster ID is required').not().isEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { jobId, amount, haulerId, posterId, hash } = req.body;
    
    // Create a payment record for the hauler (earnings)
    const haulerTransaction = {
      id: Date.now().toString(),
      userId: haulerId,
      type: 'earnings',
      jobId,
      amount: parseFloat(amount),
      from: posterId,
      hash,
      status: 'completed',
      timestamp: new Date(),
      description: `Payment received for job #${jobId}`
    };
    
    // Create a payment record for the poster (payment)
    const posterTransaction = {
      id: (Date.now() + 1).toString(),
      userId: posterId,
      type: 'payment',
      jobId,
      amount: parseFloat(amount),
      to: haulerId,
      hash,
      status: 'completed',
      timestamp: new Date(),
      description: `Payment sent for job #${jobId}`
    };
    
    transactions.push(haulerTransaction);
    transactions.push(posterTransaction);
    
    res.status(201).json({ haulerTransaction, posterTransaction });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/payments/gas-estimate
 * @desc    Get gas price estimate for transactions
 * @access  Public
 */
router.get('/gas-estimate', (req, res) => {
  try {
    // In a real app, you'd query the network for current gas prices
    // This is a simplified example
    const gasEstimate = {
      slow: 0.0001, // ETH or MATIC
      average: 0.0002,
      fast: 0.0003
    };
    
    res.json(gasEstimate);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET api/payments/transaction/:id
 * @desc    Get details of a specific transaction
 * @access  Private
 */
router.get('/transaction/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = transactions.find(tx => tx.id === id && tx.userId === req.user.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;