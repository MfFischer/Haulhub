/**
 * Region configuration with pricing parameters
 * All base values are normalized to USD for internal calculations
 * but will be displayed in local currency to users
 */
export const regionConfig = {
    // Southeast Asia
    'ph': { // Philippines
      name: 'Philippines',
      currencyCode: 'PHP',
      currencySymbol: '₱',
      baseRate: 2.00,          // USD (displayed as ~₱110)
      baseDistance: 3,         // km
      distanceIncrement: 0.50, // USD per 2km
      baseWeight: 5,           // kg
      weightIncrement: 0.75,   // USD per 5kg
      rushFactor: 1.3,         // 30% increase for rush
      maxDistance: 10,         // km
      maxWeight: 30,           // kg
      ecoDiscount: 0.10,       // 10% discount for eco-friendly vehicles
      exchangeRate: 56.50
    },
    'id': { // Indonesia
      name: 'Indonesia',
      currencyCode: 'IDR',
      currencySymbol: 'Rp',
      baseRate: 1.75,          // USD (displayed as ~Rp27,000)
      baseDistance: 3,         // km
      distanceIncrement: 0.40, // USD per 2km
      baseWeight: 5,           // kg
      weightIncrement: 0.70,   // USD per 5kg
      rushFactor: 1.35,        // 35% increase for rush
      maxDistance: 10,         // km
      maxWeight: 30,           // kg
      ecoDiscount: 0.10,       // 10% discount for eco-friendly vehicles
      exchangeRate: 15500.00
    },
    'vn': { // Vietnam
      name: 'Vietnam',
      currencyCode: 'VND',
      currencySymbol: '₫',
      baseRate: 1.80,          // USD (displayed as ~₫42,000)
      baseDistance: 3,         // km
      distanceIncrement: 0.45, // USD per 2km
      baseWeight: 5,           // kg
      weightIncrement: 0.70,   // USD per 5kg
      rushFactor: 1.3,         // 30% increase for rush
      maxDistance: 12,         // km
      maxWeight: 30,           // kg
      ecoDiscount: 0.15,       // 15% discount for eco-friendly vehicles
      exchangeRate: 24800.00
    },
    
    // European Union
    'eu': { // Euro-zone countries
      name: 'Europe',
      currencyCode: 'EUR',
      currencySymbol: '€',
      baseRate: 5.00,          // USD (displayed as ~€4.60)
      baseDistance: 5,         // km
      distanceIncrement: 1.00, // USD per 2km
      baseWeight: 10,          // kg
      weightIncrement: 2.00,   // USD per 5kg
      rushFactor: 1.5,         // 50% increase for rush
      maxDistance: 15,         // km
      maxWeight: 50,           // kg
      ecoDiscount: 0.15,       // 15% discount for eco-friendly vehicles
      exchangeRate: 0.92
    },
    'uk': { // United Kingdom
      name: 'United Kingdom',
      currencyCode: 'GBP',
      currencySymbol: '£',
      baseRate: 5.50,          // USD (displayed as ~£4.20)
      baseDistance: 5,         // km
      distanceIncrement: 1.10, // USD per 2km
      baseWeight: 10,          // kg
      weightIncrement: 2.20,   // USD per 5kg
      rushFactor: 1.5,         // 50% increase for rush
      maxDistance: 15,         // km
      maxWeight: 50,           // kg
      ecoDiscount: 0.15,       // 15% discount for eco-friendly vehicles
      exchangeRate: 0.77
    },
    
    // North America
    'us': { // United States
      name: 'United States',
      currencyCode: 'USD',
      currencySymbol: '$',
      baseRate: 5.00,          // USD
      baseDistance: 5,         // miles (not km)
      distanceIncrement: 1.00, // USD per 2 miles
      baseWeight: 10,          // lbs (not kg)
      weightIncrement: 2.00,   // USD per 10 lbs
      rushFactor: 1.5,         // 50% increase for rush
      maxDistance: 15,         // miles
      maxWeight: 50,           // lbs
      ecoDiscount: 0.10,       // 10% discount for eco-friendly vehicles
      useImperial: true,       // Use miles/lbs instead of km/kg
      exchangeRate: 1.00
    },
    'ca': { // Canada
      name: 'Canada',
      currencyCode: 'CAD',
      currencySymbol: 'C$',
      baseRate: 5.00,          // USD (displayed as ~C$6.80)
      baseDistance: 5,         // km
      distanceIncrement: 1.00, // USD per 2km
      baseWeight: 10,          // kg
      weightIncrement: 2.00,   // USD per 5kg
      rushFactor: 1.5,         // 50% increase for rush
      maxDistance: 15,         // km
      maxWeight: 50,           // kg
      ecoDiscount: 0.10,       // 10% discount for eco-friendly vehicles
      exchangeRate: 1.36
    }
  };
  
  /**
   * Exchange rates for converting USD to local currencies
   * These would be updated regularly via an API in production
   */
  export const exchangeRates = {
    'USD': 1.00,
    'PHP': 56.50,
    'IDR': 15500.00,
    'VND': 24800.00,
    'EUR': 0.92,
    'GBP': 0.77,
    'CAD': 1.36,
  };
  
  /**
   * Calculate price based on parameters and region
   * @param {String} region - Region code
   * @param {Number} distance - Distance in km (or miles for US)
   * @param {Number} weight - Weight in kg (or lbs for US)
   * @param {Boolean} isRush - Whether this is a rush delivery
   * @param {String} vehicleType - Type of vehicle (bike, car, etc.)
   * @returns {Object} - Pricing details
   */
  export const calculatePrice = (region, distance, weight, isRush = false, vehicleType = 'car') => {
    // Input validation
    if (typeof distance !== 'number' || isNaN(distance) || distance <= 0) {
      throw new Error('Distance must be a positive number');
    }
    
    if (typeof weight !== 'number' || isNaN(weight) || weight <= 0) {
      throw new Error('Weight must be a positive number');
    }
    
    // Get config for this region
    const config = regionConfig[region] || regionConfig['us'];
    
    // Start with base rate
    let priceUSD = config.baseRate;
    let distanceCharge = 0;
    let weightCharge = 0;
    
    // Add distance charge
    if (distance > config.baseDistance) {
      const extraDistance = distance - config.baseDistance;
      distanceCharge = Math.ceil(extraDistance / 2) * config.distanceIncrement;
      priceUSD += distanceCharge;
    }
    
    // Add weight charge
    if (weight > config.baseWeight) {
      const divisor = config.useImperial ? 10 : 5;
      const extraWeight = weight - config.baseWeight;
      weightCharge = Math.ceil(extraWeight / divisor) * config.weightIncrement;
      priceUSD += weightCharge;
    }
    
    // Store original price before multipliers for breakdown
    const basePriceUSD = priceUSD;
    
    // Apply rush factor if applicable
    const rushMultiplier = isRush ? config.rushFactor : 1;
    if (isRush) {
      priceUSD *= config.rushFactor;
    }
    
    // Apply eco discount for bikes/scooters
    const ecoDiscount = ['bike', 'escooter', 'bicycle', 'ebike'].includes(vehicleType?.toLowerCase()) 
      ? config.ecoDiscount 
      : 0;
      
    if (ecoDiscount > 0) {
      priceUSD *= (1 - ecoDiscount);
    }
    
    // Round to nearest 0.5 for cleaner pricing
    priceUSD = Math.ceil(priceUSD * 2) / 2;
    
    // Convert to local currency
    const exchangeRate = config.exchangeRate || 1;
    const localCurrencyPrice = priceUSD * exchangeRate;
    
    // USDC price is 1:1 with USD
    const cryptoPrice = priceUSD;
    
    return {
      priceUSD,
      cryptoPrice,
      localCurrencyPrice,
      currencyCode: config.currencyCode,
      currencySymbol: config.currencySymbol,
      formattedLocalPrice: `${config.currencySymbol}${localCurrencyPrice.toFixed(2)}`,
      formattedCryptoPrice: `${cryptoPrice.toFixed(2)} USDC`,
      distanceUnit: config.useImperial ? 'mi' : 'km',
      weightUnit: config.useImperial ? 'lbs' : 'kg',
      exchangeRate,
      details: {
        baseRate: config.baseRate,
        distanceCharge,
        weightCharge,
        rushMultiplier,
        ecoDiscount
      }
    };
  };
  
  /**
   * Get region configuration
   * @param {String} region - Region code
   * @returns {Object} - Region configuration
   */
  export const getRegionConfig = (region) => {
    return regionConfig[region] || regionConfig['us'];
  };
  
  /**
   * Convert amount between currencies
   * @param {Number} amount - Amount to convert
   * @param {String} fromCurrency - Source currency code
   * @param {String} toCurrency - Target currency code
   * @returns {Number} - Converted amount
   */
  export const convertCurrency = (amount, fromCurrency, toCurrency) => {
    // Convert to USD first if not already
    const amountInUSD = fromCurrency === 'USD' 
      ? amount 
      : amount / (exchangeRates[fromCurrency] || 1);
    
    // Then convert from USD to target currency
    return amountInUSD * (exchangeRates[toCurrency] || 1);
  };
  
  /**
   * Format price with appropriate currency symbol
   * @param {Number} amount - Price amount
   * @param {String} region - Region code
   * @returns {String} - Formatted price with currency symbol
   */
  export const formatPrice = (amount, region) => {
    const config = regionConfig[region] || regionConfig['us'];
    return `${config.currencySymbol}${amount.toFixed(2)}`;
  };
  
  /**
   * Get distance unit based on region
   * @param {String} region - Region code
   * @returns {String} - Distance unit (km or mi)
   */
  export const getDistanceUnit = (region) => {
    const config = regionConfig[region] || regionConfig['us'];
    return config.useImperial ? 'mi' : 'km';
  };
  
  /**
   * Get weight unit based on region
   * @param {String} region - Region code
   * @returns {String} - Weight unit (kg or lbs)
   */
  export const getWeightUnit = (region) => {
    const config = regionConfig[region] || regionConfig['us'];
    return config.useImperial ? 'lbs' : 'kg';
  };