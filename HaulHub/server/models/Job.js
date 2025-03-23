const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  posterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Poster ID is required']
  },
  haulerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'open'
  },
  pickup: {
    address: {
      type: String,
      required: [true, 'Pickup address is required']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Pickup coordinates are required']
      }
    },
    contactName: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  dropoff: {
    address: {
      type: String,
      required: [true, 'Dropoff address is required']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Dropoff coordinates are required']
      }
    },
    contactName: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  schedule: {
    // Flexible schedule options
    pickupDate: {
      type: Date,
      required: [true, 'Pickup date is required']
    },
    pickupTimeWindow: {
      start: {
        type: String,
        default: null
      },
      end: {
        type: String,
        default: null
      }
    },
    dropoffDate: {
      type: Date,
      default: null
    },
    isFlexible: {
      type: Boolean,
      default: false
    },
    isRush: {
      type: Boolean,
      default: false
    }
  },
  items: {
    // Details about what's being transported
    type: {
      type: String, // furniture, appliances, boxes, etc.
      required: [true, 'Item type is required']
    },
    weight: {
      type: Number, // in kilograms
      required: [true, 'Weight is required'],
      min: [0.1, 'Weight must be greater than 0']
    },
    dimensions: {
      length: {
        type: Number, // in centimeters
        default: null
      },
      width: {
        type: Number,
        default: null
      },
      height: {
        type: Number,
        default: null
      }
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    requiresHandling: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    },
    photos: [{
      url: String,
      caption: String
    }]
  },
  vehicle: {
    // Vehicle requirements
    type: {
      type: String, // car, van, truck, etc.
      default: 'any'
    },
    minCapacity: {
      type: Number, // in cubic meters or kg
      default: null
    }
  },
  payment: {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    method: {
      type: String,
      enum: ['crypto', 'cash', 'credit', 'other'],
      default: 'crypto'
    },
    status: {
      type: String,
      enum: ['pending', 'held', 'released', 'refunded', 'disputed'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      default: null
    },
    escrowAddress: {
      type: String,
      default: null
    }
  },
  distance: {
    // Route information
    estimated: {
      type: Number, // in kilometers
      default: null
    },
    actual: {
      type: Number,
      default: null
    }
  },
  timeTracking: {
    // Job timing events
    accepted: {
      type: Date,
      default: null
    },
    pickedUp: {
      type: Date,
      default: null
    },
    delivered: {
      type: Date,
      default: null
    },
    completed: {
      type: Date,
      default: null
    },
    cancelled: {
      type: Date,
      default: null
    }
  },
  rating: {
    // Rating given after job completion
    haulerRating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      comment: String,
      timestamp: Date
    },
    posterRating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      comment: String,
      timestamp: Date
    }
  },
  blockchain: {
    // Blockchain-related data
    contractAddress: {
      type: String,
      default: null
    },
    jobId: {
      type: String,
      default: null
    },
    transactions: [{
      type: String, // transaction hash
      description: String,
      timestamp: Date
    }]
  },
  meta: {
    // Additional metadata
    source: {
      type: String,
      default: 'app' // app, web, api, etc.
    },
    ip: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient querying
JobSchema.index({ posterId: 1, createdAt: -1 }); // Jobs by poster
JobSchema.index({ haulerId: 1, status: 1 }); // Jobs by hauler and status
JobSchema.index({ 'pickup.location': '2dsphere' }); // Geospatial index for pickup
JobSchema.index({ 'dropoff.location': '2dsphere' }); // Geospatial index for dropoff
JobSchema.index({ status: 1, 'schedule.pickupDate': 1 }); // Open jobs by date

// Virtual for poster details
JobSchema.virtual('poster', {
  ref: 'User',
  localField: 'posterId',
  foreignField: '_id',
  justOne: true
});

// Virtual for hauler details
JobSchema.virtual('hauler', {
  ref: 'User',
  localField: 'haulerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for calculating job duration
JobSchema.virtual('duration').get(function() {
  if (this.timeTracking.pickedUp && this.timeTracking.delivered) {
    return (this.timeTracking.delivered - this.timeTracking.pickedUp) / (1000 * 60); // in minutes
  }
  return null;
});

// Method to assign job to hauler
JobSchema.methods.assignHauler = function(haulerId) {
  if (this.status !== 'open') {
    throw new Error(`Cannot assign job with status: ${this.status}`);
  }

  this.haulerId = haulerId;
  this.status = 'assigned';
  this.timeTracking.accepted = new Date();
  
  return this.save();
};

// Method to mark job as in progress
JobSchema.methods.startJob = function() {
  if (this.status !== 'assigned') {
    throw new Error(`Cannot start job with status: ${this.status}`);
  }

  this.status = 'in_progress';
  this.timeTracking.pickedUp = new Date();
  
  return this.save();
};

// Method to mark job as completed
JobSchema.methods.completeJob = function() {
  if (this.status !== 'in_progress') {
    throw new Error(`Cannot complete job with status: ${this.status}`);
  }

  this.status = 'completed';
  this.timeTracking.delivered = new Date();
  this.timeTracking.completed = new Date();
  
  return this.save();
};

// Method to cancel job
JobSchema.methods.cancelJob = function(reason) {
  if (['completed', 'cancelled', 'disputed'].includes(this.status)) {
    throw new Error(`Cannot cancel job with status: ${this.status}`);
  }

  this.status = 'cancelled';
  this.timeTracking.cancelled = new Date();
  this.meta.tags = [...(this.meta.tags || []), 'cancelled', reason];
  
  return this.save();
};

// Static method to find nearby jobs
JobSchema.statics.findNearbyJobs = async function(latitude, longitude, radiusInKm = 5, options = {}) {
  const { status = 'open', maxResults = 20 } = options;
  
  const nearbyJobs = await this.find({
    status,
    'pickup.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude] // GeoJSON uses [lng, lat]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  })
  .limit(maxResults)
  .populate('poster', 'fullName profileImage')
  .sort({ 'schedule.pickupDate': 1 });
  
  return nearbyJobs;
};

module.exports = mongoose.model('Job', JobSchema);