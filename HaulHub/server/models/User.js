const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in query results by default
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['hauler', 'poster'],
    default: 'poster'
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },
  walletAddress: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return v === null || /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: props => `${props.value} is not a valid Ethereum address!`
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Fields specific to Haulers
  haulerDetails: {
    type: {
      avgRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalJobs: {
        type: Number,
        default: 0
      },
      completedJobs: {
        type: Number,
        default: 0
      },
      totalEarnings: {
        type: Number,
        default: 0
      },
      isAvailable: {
        type: Boolean,
        default: true
      },
      // Store the current or last known location
      currentLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        },
        lastUpdated: {
          type: Date,
          default: null
        }
      }
    },
    default: null
  },
  // Fields specific to Posters
  posterDetails: {
    type: {
      totalJobs: {
        type: Number,
        default: 0
      },
      completedJobs: {
        type: Number,
        default: 0
      },
      totalSpent: {
        type: Number,
        default: 0
      }
    },
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Create index for email for faster querying
UserSchema.index({ email: 1 });

// Create geospatial index for haulers' location
UserSchema.index({ 'haulerDetails.currentLocation': '2dsphere' });

// Virtual property for vehicles (for haulers)
UserSchema.virtual('vehicles', {
  ref: 'Vehicle',
  localField: '_id',
  foreignField: 'userId'
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set appropriate default details based on user type
UserSchema.pre('save', function(next) {
  if (this.isNew) {
    if (this.userType === 'hauler' && !this.haulerDetails) {
      this.haulerDetails = {};
    } else if (this.userType === 'poster' && !this.posterDetails) {
      this.posterDetails = {};
    }
  }
  next();
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Method to generate JWT
UserSchema.methods.generateToken = function() {
  return jwt.sign(
    { 
      user: { 
        id: this._id, 
        userType: this.userType 
      } 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Method to update current location (for haulers)
UserSchema.methods.updateLocation = function(latitude, longitude) {
  if (this.userType !== 'hauler') {
    throw new Error('Only haulers can update location');
  }
  
  if (!this.haulerDetails) {
    this.haulerDetails = {};
  }
  
  this.haulerDetails.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude], // GeoJSON uses [lng, lat]
    lastUpdated: new Date()
  };
};

// Static method to find nearby haulers
UserSchema.statics.findNearbyHaulers = async function(latitude, longitude, radiusInKm = 5, options = {}) {
  const { isAvailable = true, maxResults = 10 } = options;
  
  const nearbyHaulers = await this.find({
    userType: 'hauler',
    'haulerDetails.isAvailable': isAvailable,
    'haulerDetails.currentLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude] // GeoJSON uses [lng, lat]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  }).limit(maxResults);
  
  return nearbyHaulers;
};

module.exports = mongoose.model('User', UserSchema);