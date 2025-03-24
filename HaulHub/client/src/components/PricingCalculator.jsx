import React, { useState, useEffect } from 'react';

const PricingCalculator = () => {
  // Simulated region detection - in production would use geolocation
  const [userRegion, setUserRegion] = useState('us');
  const [distance, setDistance] = useState(3);
  const [weight, setWeight] = useState(5);
  const [isRush, setIsRush] = useState(false);
  const [vehicleType, setVehicleType] = useState('car');
  const [price, setPrice] = useState(null);

  // Sample region config (simplified version of what would be imported)
  const regionConfig = {
    'ph': {
      name: 'Philippines',
      currencyCode: 'PHP',
      currencySymbol: '₱',
      baseRate: 2.00,
      exchangeRate: 56.50,
      useImperial: false,
      distanceUnit: 'km',
      weightUnit: 'kg',
    },
    'us': {
      name: 'United States',
      currencyCode: 'USD',
      currencySymbol: '$',
      baseRate: 5.00,
      exchangeRate: 1.00,
      useImperial: true,
      distanceUnit: 'mi',
      weightUnit: 'lbs',
    },
    'eu': {
      name: 'Europe',
      currencyCode: 'EUR',
      currencySymbol: '€',
      baseRate: 5.00,
      exchangeRate: 0.92,
      useImperial: false,
      distanceUnit: 'km',
      weightUnit: 'kg',
    },
    'uk': {
      name: 'United Kingdom',
      currencyCode: 'GBP',
      currencySymbol: '£',
      baseRate: 5.50,
      exchangeRate: 0.77,
      useImperial: false,
      distanceUnit: 'km',
      weightUnit: 'kg',
    }
  };

  // Simulated price calculation function
  const calculatePrice = () => {
    const config = regionConfig[userRegion];
    
    // Base price calculation logic (simplified)
    let priceUSD = config.baseRate;
    
    // Add distance charge
    if (distance > 3) {
      priceUSD += Math.ceil((distance - 3) / 2) * 0.5;
    }
    
    // Add weight charge
    if (weight > 5) {
      priceUSD += Math.ceil((weight - 5) / 5) * 1.0;
    }
    
    // Rush fee
    if (isRush) {
      priceUSD *= 1.5;
    }
    
    // Eco discount
    if (vehicleType === 'bike' || vehicleType === 'escooter') {
      priceUSD *= 0.9; // 10% discount
    }
    
    // Convert to local currency
    const localPrice = priceUSD * config.exchangeRate;
    
    return {
      usdPrice: priceUSD.toFixed(2),
      localPrice: localPrice.toFixed(2),
      currencySymbol: config.currencySymbol,
      cryptoPrice: priceUSD.toFixed(2)
    };
  };

  // Calculate price whenever inputs change
  useEffect(() => {
    setPrice(calculatePrice());
  }, [userRegion, distance, weight, isRush, vehicleType]);

  // Get current region config
  const currentRegion = regionConfig[userRegion];
  
  return (
    <div className="flex flex-col p-6 bg-gray-800 text-white rounded-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">HaulHub Pricing Calculator</h2>
      
      {/* Region selector */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Region</label>
        <select 
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          value={userRegion}
          onChange={(e) => setUserRegion(e.target.value)}
        >
          <option value="ph">Philippines</option>
          <option value="us">United States</option>
          <option value="eu">Europe (Euro)</option>
          <option value="uk">United Kingdom</option>
        </select>
      </div>
      
      {/* Distance input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">
          Distance ({currentRegion.distanceUnit})
        </label>
        <input 
          type="range" 
          min="1" 
          max="15" 
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400">
          <span>1 {currentRegion.distanceUnit}</span>
          <span>{distance} {currentRegion.distanceUnit}</span>
          <span>15 {currentRegion.distanceUnit}</span>
        </div>
      </div>
      
      {/* Weight input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">
          Weight ({currentRegion.weightUnit})
        </label>
        <input 
          type="range" 
          min="1" 
          max="50" 
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400">
          <span>1 {currentRegion.weightUnit}</span>
          <span>{weight} {currentRegion.weightUnit}</span>
          <span>50 {currentRegion.weightUnit}</span>
        </div>
      </div>
      
      {/* Options */}
      <div className="mb-4 flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-300 mb-1">Vehicle Type</label>
          <select 
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="car">Car</option>
            <option value="bike">Bicycle</option>
            <option value="escooter">E-Scooter</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-300 mb-1">Rush Delivery</label>
          <div className="flex items-center h-10">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox h-5 w-5 text-green-600 bg-gray-700 border-gray-600 rounded"
                checked={isRush}
                onChange={(e) => setIsRush(e.target.checked)}
              />
              <span className="ml-2">Priority (+50%)</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Price display */}
      {price && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <div className="text-lg font-semibold mb-2">Price Estimate:</div>
          <div className="flex justify-between items-center bg-gray-700 p-3 rounded-md mb-2">
            <div className="text-gray-300">Local Currency:</div>
            <div className="text-xl font-bold text-green-400">{price.currencySymbol}{price.localPrice}</div>
          </div>
          <div className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
            <div className="text-gray-300">Crypto Payment:</div>
            <div className="text-xl font-bold text-green-400">{price.cryptoPrice} USDC</div>
          </div>
        </div>
      )}
      
      {/* Info block */}
      <div className="mt-6 text-sm text-gray-400">
        <div className="font-medium text-gray-300 mb-1">Base rate for {currentRegion.name}:</div>
        <div className="mb-2">{currentRegion.currencySymbol}{(currentRegion.baseRate * currentRegion.exchangeRate).toFixed(2)} for first 3 {currentRegion.distanceUnit} and 5 {currentRegion.weightUnit}</div>
        
        {vehicleType === 'bike' || vehicleType === 'escooter' ? (
          <div className="text-green-400">10% eco discount applied for {vehicleType}</div>
        ) : null}
        
        {isRush ? (
          <div className="text-yellow-400">50% rush fee applied</div>
        ) : null}
      </div>
    </div>
  );
};

export default PricingCalculator;