import React, { useContext } from 'react';
import LocationContext from '../../context/LocationContext';
import WalletContext from '../../context/WalletContext';

const JobForm = ({
  formData,
  onInputChange,
  onAddressChange,
  onCalculateRoute,
  onSubmit,
  isSubmitting,
  showPriceCalculated
}) => {
  const { userRegion } = useContext(LocationContext);
  const { isConnected } = useContext(WalletContext);
  
  // Get distance and weight units based on region
  const getUnits = () => {
    const isImperial = ['us'].includes(userRegion);
    return {
      distance: isImperial ? 'mi' : 'km',
      weight: isImperial ? 'lbs' : 'kg'
    };
  };
  
  const units = getUnits();
  
  // Prefill address with current location
  const handleUseCurrentLocation = async (fieldName) => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const { latitude, longitude } = position.coords;
      
      // Reverse geocode coordinates to get address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
        `access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=address`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        onAddressChange(fieldName, address);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Unable to get your current location. Please enter address manually.');
    }
  };
  
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg">
      {/* Item Details */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Item Details</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Item Name*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              placeholder="e.g., Laptop, Documents, Small Package"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              placeholder="Add details about the item, special handling instructions, etc."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              Weight ({units.weight})
            </label>
            <div className="flex items-center">
              <input
                type="range"
                id="weight"
                name="weight"
                min="1"
                max="50"
                step="1"
                value={formData.weight}
                onChange={onInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-3 min-w-[40px] text-center font-medium">
                {formData.weight}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 {units.weight}</span>
              <span>25 {units.weight}</span>
              <span>50 {units.weight}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <select
                id="vehicleType"
                name="vehicleType"
                value={formData.vehicleType}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="car">Car</option>
                <option value="bike">Bicycle</option>
                <option value="escooter">E-Scooter</option>
              </select>
              {(formData.vehicleType === 'bike' || formData.vehicleType === 'escooter') && (
                <p className="text-xs text-green-600 mt-1">
                  Eco discount applied for green transportation!
                </p>
              )}
            </div>
            
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="isRush"
                name="isRush"
                checked={formData.isRush}
                onChange={onInputChange}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="isRush" className="ml-2 block text-sm text-gray-700">
                Rush Delivery (+50%)
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Details */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Location Details</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="pickup" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Address*
            </label>
            <div className="flex">
              <input
                type="text"
                id="pickup"
                name="pickup"
                value={formData.pickup}
                onChange={(e) => onAddressChange('pickup', e.target.value)}
                placeholder="Enter pickup address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="button"
                onClick={() => handleUseCurrentLocation('pickup')}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-r-md text-gray-700 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Current
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="dropoff" className="block text-sm font-medium text-gray-700 mb-1">
              Dropoff Address*
            </label>
            <div className="flex">
              <input
                type="text"
                id="dropoff"
                name="dropoff"
                value={formData.dropoff}
                onChange={(e) => onAddressChange('dropoff', e.target.value)}
                placeholder="Enter dropoff address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="button"
                onClick={() => handleUseCurrentLocation('dropoff')}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-r-md text-gray-700 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Current
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCalculateRoute}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Calculate Route
            </button>
          </div>
        </div>
      </div>
      
      {/* Payment Method */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="radio"
              id="crypto"
              name="paymentMethod"
              value="crypto"
              checked={formData.paymentMethod === 'crypto'}
              onChange={onInputChange}
              className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <label htmlFor="crypto" className="ml-2 block text-sm text-gray-700">
              Crypto (USDC)
              {!isConnected && (
                <span className="ml-2 text-xs text-yellow-600">(Wallet not connected)</span>
              )}
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="radio"
              id="card"
              name="paymentMethod"
              value="card"
              checked={formData.paymentMethod === 'card'}
              onChange={onInputChange}
              className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <label htmlFor="card" className="ml-2 block text-sm text-gray-700">
              Credit Card
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="radio"
              id="paypal"
              name="paymentMethod"
              value="paypal"
              checked={formData.paymentMethod === 'paypal'}
              onChange={onInputChange}
              className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <label htmlFor="paypal" className="ml-2 block text-sm text-gray-700">
              PayPal
            </label>
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="mt-8">
        <button
          type="submit"
          disabled={isSubmitting || !showPriceCalculated}
          className={`w-full px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
            ${
              showPriceCalculated
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            } 
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Request...
            </span>
          ) : (
            <span>Create Haul Request</span>
          )}
        </button>
        
        {!showPriceCalculated && (
          <p className="mt-2 text-sm text-center text-red-600">
            Please calculate the route first to get pricing
          </p>
        )}
      </div>
    </form>
  );
};

export default JobForm;