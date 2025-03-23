const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: [
      'car', 
      'van', 
      'pickup', 
      'box_truck', 
      'flatbed', 
      'cargo_van', 
      'suv', 
      'trailer', 
      'motorcycle',
      'bicycle',
      'other'
    ]
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: [1900, 'Year cannot be earlier than 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    trim: true,
    uppercase: true
  },
  color: {
    type: String,
    trim: true,
    default: ''
  },
  capacity: {
    // Cargo capacity
    volume: {
      type: Number, // in cubic meters
      default: null
    },
    weight: {
      type: Number, // in kilograms
      default: null
    },
    length: {
      type: Number, // in centimeters
      default: null
    },
    width: {
      type: Number, // in centimeters
      default: null
    },
    height: {
      type: Number, // in centimeters
      default: null
    }
  },
  features: {
    hasTailLift: {
      type: Boolean,
      default: false
    },
    hasRamp: {
      type: Boolean,
      default: false
    },
    hasDolly: {
      type: Boolean,
      default: false
    },
    hasStraps: {
      type: Boolean,
      default: false
    },
    hasBlankets: {
      type: Boolean,
      default: false
    },
    isRefrigerated: {
      type: Boolean,
      default: false
    },
    isEnclosed: {
      type: Boolean,
      default: true
    },
    additionalFeatures: [String]
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: {
    // Vehicle-related documents
    insurance: {
      documentUrl: {
        type: String,
        default: null
      },
      expiryDate: {
        type: Date,
        default: null
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedAt: {
        type: Date,
        default: null
      }
    },
    registration: {
      documentUrl: {
        type: String,
        default: null
      },
      expiryDate: {
        type: Date,
        default: null
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedAt: {
        type: Date,
        default: null
      }
    },
    inspection: {
      documentUrl: {
        type: String,
        default: null
      },
      expiryDate: {
        type: Date,
        default: null
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedAt: {
        type: Date,
        default: null
      }
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
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired'],
      default: 'pending'
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  notes: {
    type: String,
    default: ''
  },
  location: {
    // Current or last known location of the vehicle
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient querying
VehicleSchema.index({ userId: 1 }); 
VehicleSchema.index({ vehicleType: 1, isActive: 1 });
VehicleSchema.index({ location: '2dsphere' });
VehicleSchema.index({ 'verification.status': 1 });

// Virtual for user details
VehicleSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual to get formatted dimensions
VehicleSchema.virtual('formattedDimensions').get(function() {
  const { length, width, height } = this.capacity;
  
  if (length && width && height) {
    return `${length} × ${width} × ${height} cm`;
  }
  
  return 'Dimensions not specified';
});

// Calculate volume from dimensions if not explicitly set
VehicleSchema.pre('save', function(next) {
  const { length, width, height } = this.capacity;
  
  if (length && width && height && !this.capacity.volume) {
    // Length, width, height in cm, volume in cubic meters
    this.capacity.volume = (length * width * height) / 1000000;
  }
  
  next();
});

// Method to verify vehicle
VehicleSchema.methods.verify = function(adminUserId) {
  this.isVerified = true;
  this.verification = {
    status: 'verified',
    verifiedAt: new Date(),
    verifiedBy: adminUserId
  };
  
  return this.save();
};

// Method to reject vehicle verification
VehicleSchema.methods.rejectVerification = function(adminUserId, reason) {
  this.isVerified = false;
  this.verification = {
    status: 'rejected',
    verifiedAt: new Date(),
    verifiedBy: adminUserId,
    rejectionReason: reason
  };
  
  return this.save();
};

// Method to add image
VehicleSchema.methods.addImage = function(imageUrl, description = '', isPrimary = false) {
  const newImage = {
    url: imageUrl,
    description,
    isPrimary,
    uploadedAt: new Date()
  };
  
  // If this is the primary image, set all others to non-primary
  if (isPrimary && this.images.length > 0) {
    this.images.forEach(image => {
      image.isPrimary = false;
    });
  }
  
  // If this is the first image, make it primary
  if (this.images.length === 0) {
    newImage.isPrimary = true;
  }
  
  this.images.push(newImage);
  
  return this.save();
};

// Method to update vehicle location
VehicleSchema.methods.updateLocation = function(latitude, longitude) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude], // GeoJSON uses [lng, lat]
    lastUpdated: new Date()
  };
  
  return this.save();
};

// Static method to find nearby vehicles
VehicleSchema.statics.findNearbyVehicles = async function(latitude, longitude, radiusInKm = 5, options = {}) {
  const { vehicleType, isActive = true, maxResults = 10 } = options;
  
  const query = {
    isActive,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude] // GeoJSON uses [lng, lat]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  };
  
  // Add vehicle type filter if specified
  if (vehicleType) {
    query.vehicleType = vehicleType;
  }
  
  const nearbyVehicles = await this.find(query)
    .populate('user', 'fullName')
    .limit(maxResults);
  
  return nearbyVehicles;
};

module.exports = mongoose.model('Vehicle', VehicleSchema);