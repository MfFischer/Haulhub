/**
 * Region configuration with pricing parameters
 * All base values are normalized to USD for internal calculations
 * but will be displayed in local currency to users
 */
const regionConfig = {
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
   * Calculate price based on parameters and region
   * @param {String} region - Region code
   * @param {Number} distance - Distance in km (or miles for US)
   * @param {Number} weight - Weight in kg (or lbs for US)
   * @param {Boolean} isRush - Whether this is a rush delivery
   * @param {String} vehicleType - Type of vehicle (bike, car, etc.)
   * @returns {Object} - Pricing details
   */
  function calculatePrice(region, distance, weight, isRush = false, vehicleType = 'car') {
    // Get config for this region
    const config = regionConfig[region] || regionConfig['us'];
    
    // Start with base rate
    let priceUSD = config.baseRate;
    
    // Add distance charge
    if (distance > config.baseDistance) {
      const extraDistance = distance - config.baseDistance;
      const extraDistanceCharge = Math.ceil(extraDistance / 2) * config.distanceIncrement;
      priceUSD += extraDistanceCharge;
    }
    
    // Add weight charge
    if (weight > config.baseWeight) {
      const divisor = config.useImperial ? 10 : 5;
      const extraWeight = weight - config.baseWeight;
      const extraWeightCharge = Math.ceil(extraWeight / divisor) * config.weightIncrement;
      priceUSD += extraWeightCharge;
    }
    
    // Apply rush factor if applicable
    if (isRush) {
      priceUSD *= config.rushFactor;
    }
    
    // Apply eco discount for bikes/scooters
    if (['bike', 'escooter', 'bicycle', 'ebike'].includes(vehicleType?.toLowerCase())) {
      priceUSD *= (1 - config.ecoDiscount);
    }
    
    // Round to nearest 0.5 for cleaner pricing
    priceUSD = Math.ceil(priceUSD * 2) / 2;
    
    // Convert to local currency
    const localCurrencyPrice = priceUSD * config.exchangeRate;
    
    // USDC price is 1:1 with USD
    const cryptoPrice = priceUSD;
    
    return {
      priceUSD,
      cryptoPrice,
      localCurrencyPrice: Math.round(localCurrencyPrice * 100) / 100,
      currencyCode: config.currencyCode,
      currencySymbol: config.currencySymbol,
      formattedLocalPrice: `${config.currencySymbol}${localCurrencyPrice.toFixed(2)}`,
      formattedCryptoPrice: `${cryptoPrice.toFixed(2)} USDC`,
      distanceUnit: config.useImperial ? 'mi' : 'km',
      weightUnit: config.useImperial ? 'lbs' : 'kg',
      details: {
        baseRate: config.baseRate,
        distanceCharge: distance > config.baseDistance 
          ? Math.ceil((distance - config.baseDistance) / 2) * config.distanceIncrement 
          : 0,
        weightCharge: weight > config.baseWeight 
          ? Math.ceil((weight - config.baseWeight) / (config.useImperial ? 10 : 5)) * config.weightIncrement 
          : 0,
        rushMultiplier: isRush ? config.rushFactor : 1,
        ecoDiscount: ['bike', 'escooter', 'bicycle', 'ebike'].includes(vehicleType?.toLowerCase()) 
          ? config.ecoDiscount 
          : 0
      }
    };
  }
  
  /**
   * Get region configuration
   * @param {String} region - Region code
   * @returns {Object} - Region configuration
   */
  function getRegionConfig(region) {
    return regionConfig[region] || regionConfig['us'];
  }
  
  /**
   * List all available regions
   * @returns {Array} - Array of region codes and names
   */
  function listRegions() {
    return Object.keys(regionConfig).map(code => ({
      code,
      name: regionConfig[code].name,
      currencyCode: regionConfig[code].currencyCode,
      currencySymbol: regionConfig[code].currencySymbol
    }));
  }
  
  module.exports = {
    calculatePrice,
    getRegionConfig,
    listRegions
  };