import React, { useContext } from 'react';
import LocationContext from '../context/LocationContext';

const PricingPreview = ({ price, distance, weight, isRush, vehicleType }) => {
  const { userRegion } = useContext(LocationContext);
  
  // Get units based on region
  const getUnits = () => {
    const isImperial = ['us'].includes(userRegion);
    return {
      distance: isImperial ? 'mi' : 'km',
      weight: isImperial ? 'lbs' : 'kg'
    };
  };
  
  const units = getUnits();
  
  // Format currency with proper symbol and decimal places
  const formatCurrency = (amount, currencySymbol) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
  
  if (!price) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing Preview</h3>
        <p className="text-gray-600">
          Calculating price...
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing Preview</h3>
      
      {/* Price Display */}
      <div className="mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xl font-bold text-gray-900 mb-1">
            {formatCurrency(price.localCurrencyPrice, price.currencySymbol)}
          </div>
          <div className="text-sm text-gray-600">
            {price.cryptoPrice.toFixed(2)} USDC
          </div>
        </div>
      </div>
      
      {/* Job Details Summary */}
      <h4 className="font-medium text-gray-900 mb-2">Haul Details</h4>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500">Distance</div>
          <div className="font-medium text-gray-900">{distance.toFixed(1)} {units.distance}</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500">Weight</div>
          <div className="font-medium text-gray-900">{weight} {units.weight}</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500">Vehicle</div>
          <div className="font-medium text-gray-900 capitalize">{vehicleType}</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500">Delivery Type</div>
          <div className="font-medium text-gray-900">{isRush ? 'Rush' : 'Standard'}</div>
        </div>
      </div>
      
      {/* Price Breakdown */}
      <h4 className="font-medium text-gray-900 mb-2">Price Breakdown</h4>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          <div className="flex justify-between p-3">
            <div className="text-sm">Base Rate</div>
            <div className="font-medium">
              {formatCurrency(price.details.baseRate * price.exchangeRate, price.currencySymbol)}
            </div>
          </div>
          
          {price.details.distanceCharge > 0 && (
            <div className="flex justify-between p-3">
              <div className="text-sm">Distance Charge</div>
              <div className="font-medium">
                {formatCurrency(price.details.distanceCharge * price.exchangeRate, price.currencySymbol)}
              </div>
            </div>
          )}
          
          {price.details.weightCharge > 0 && (
            <div className="flex justify-between p-3">
              <div className="text-sm">Weight Charge</div>
              <div className="font-medium">
                {formatCurrency(price.details.weightCharge * price.exchangeRate, price.currencySymbol)}
              </div>
            </div>
          )}
          
          {isRush && (
            <div className="flex justify-between p-3 bg-yellow-50">
              <div className="text-sm">Rush Fee</div>
              <div className="font-medium text-yellow-700">
                +{((price.details.rushMultiplier - 1) * 100).toFixed(0)}%
              </div>
            </div>
          )}
          
          {(vehicleType === 'bike' || vehicleType === 'escooter') && (
            <div className="flex justify-between p-3 bg-green-50">
              <div className="text-sm">Eco Discount</div>
              <div className="font-medium text-green-700">
                -{(price.details.ecoDiscount * 100).toFixed(0)}%
              </div>
            </div>
          )}
          
          <div className="flex justify-between p-3 bg-gray-50">
            <div className="font-medium">Total</div>
            <div className="font-bold text-green-700">
              {formatCurrency(price.localCurrencyPrice, price.currencySymbol)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPreview;