const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'payment', 'earnings', 'refund', 'fee'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'MATIC',
    enum: ['MATIC', 'ETH', 'USDC', 'USD', 'OTHER']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  // Job reference (if transaction is related to a job)
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  // For payments: who the money went to
  recipient: {
    type: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      walletAddress: String,
      name: String
    },
    default: null
  },
  // For earnings: who the money came from
  sender: {
    type: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      walletAddress: String,
      name: String
    },
    default: null
  },
  // Blockchain details
  blockchain: {
    type: {
      network: {
        type: String,
        enum: ['ethereum', 'polygon', 'mumbai', 'other'],
        default: 'polygon'
      },
      hash: {
        type: String,
        default: null
      },
      blockNumber: {
        type: Number,
        default: null
      },
      confirmation: {
        type: Number,
        default: 0
      },
      gasUsed: {
        type: String,
        default: null
      },
      gasPrice: {
        type: String,
        default: null
      },
      contractAddress: {
        type: String,
        default: null
      }
    },
    default: null
  },
  // For withdrawals
  withdrawal: {
    type: {
      walletAddress: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^0x[a-fA-F0-9]{40}$/.test(v);
          },
          message: props => `${props.value} is not a valid Ethereum address!`
        }
      },
      fee: {
        type: Number,
        default: 0
      },
      processedAt: {
        type: Date,
        default: null
      },
      notes: {
        type: String,
        default: ''
      }
    },
    default: null
  },
  // Payment method details for non-crypto payments
  paymentMethod: {
    type: {
      provider: {
        type: String,
        enum: ['stripe', 'paypal', 'bank', 'cash', 'other'],
        default: 'other'
      },
      reference: {
        type: String,
        default: null
      },
      last4: {
        type: String,
        default: null
      }
    },
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient querying
TransactionSchema.index({ userId: 1, createdAt: -1 }); // User's transactions
TransactionSchema.index({ 'blockchain.hash': 1 }, { sparse: true }); // Query by transaction hash
TransactionSchema.index({ jobId: 1 }, { sparse: true }); // Transactions by job
TransactionSchema.index({ status: 1, type: 1 }); // For finding pending withdrawals, etc.

// Virtual for job details
TransactionSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true
});

// Virtual for user details
TransactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to mark transaction as completed
TransactionSchema.methods.markCompleted = function(blockchainData = {}) {
  this.status = 'completed';
  
  if (Object.keys(blockchainData).length > 0) {
    this.blockchain = {
      ...this.blockchain,
      ...blockchainData
    };
  }
  
  return this.save();
};

// Method to mark transaction as failed
TransactionSchema.methods.markFailed = function(reason = '') {
  this.status = 'failed';
  this.notes = this.notes ? `${this.notes}\nFailure reason: ${reason}` : `Failure reason: ${reason}`;
  
  return this.save();
};

// Static method to get user's balance
TransactionSchema.statics.getUserBalance = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: 'completed' } },
    { $group: {
        _id: '$currency',
        balance: {
          $sum: {
            $cond: [
              { $in: ['$type', ['deposit', 'earnings', 'refund']] },
              '$amount',
              { $multiply: ['$amount', -1] }
            ]
          }
        }
      }
    }
  ]);
  
  // Transform result into an object
  const balance = {};
  result.forEach(item => {
    balance[item._id] = item.balance;
  });
  
  return balance;
};

// Middleware to update user balance after transaction completion
TransactionSchema.post('save', async function(doc) {
  // Only process completed transactions
  if (doc.status === 'completed') {
    try {
      // In a real application, you might want to update user balances in your User model
      // or keep a separate Balance collection that's updated when transactions change
      
      // This is where you could emit events for transaction completion
      // or trigger push notifications, etc.
      
      console.log(`Transaction ${doc._id} completed for user ${doc.userId}`);
    } catch (error) {
      console.error('Error in transaction post-save hook:', error);
    }
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);