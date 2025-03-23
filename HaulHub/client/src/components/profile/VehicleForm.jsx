import React, { useState } from 'react';

/**
 * Vehicle Form Component - Form for adding vehicles to user profile
 * 
 * @param {Object} props
 * @param {Function} props.onAddVehicle - Function to call when adding a vehicle
 * @returns {JSX.Element}
 */
const VehicleForm = ({ onAddVehicle }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [vehicle, setVehicle] = useState({
    type: 'car',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    maxWeight: ''
  });
  const [errors, setErrors] = useState({});
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicle(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!vehicle.make.trim()) {
      newErrors.make = 'Make is required';
    }
    
    if (!vehicle.model.trim()) {
      newErrors.model = 'Model is required';
    }
    
    if (!vehicle.year || vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Please enter a valid year';
    }
    
    if (!vehicle.color.trim()) {
      newErrors.color = 'Color is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Add vehicle
    onAddVehicle(vehicle);
    
    // Reset form
    setVehicle({
      type: 'car',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      licensePlate: '',
      maxWeight: ''
    });
    
    // Close form
    setIsAdding(false);
  };
  
  // Handle cancel
  const handleCancel = () => {
    setIsAdding(false);
    setErrors({});
    setVehicle({
      type: 'car',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      licensePlate: '',
      maxWeight: ''
    });
  };
  
  // If not adding, show button
  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add a Vehicle
      </button>
    );
  }
  
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add a Vehicle</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Vehicle Type */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="car"
                  checked={vehicle.type === 'car'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700">Car</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="bike"
                  checked={vehicle.type === 'bike'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700">Bicycle</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="escooter"
                  checked={vehicle.type === 'escooter'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700">E-Scooter</span>
              </label>
            </div>
          </div>
          
          {/* Make */}
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
              Make
            </label>
            <input
              type="text"
              id="make"
              name="make"
              value={vehicle.make}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${
                errors.make ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
              placeholder="e.g., Toyota, Honda"
            />
            {errors.make && (
              <p className="mt-1 text-sm text-red-600">{errors.make}</p>
            )}
          </div>
          
          {/* Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={vehicle.model}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${
                errors.model ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
              placeholder="e.g., Corolla, Civic"
            />
            {errors.model && (
              <p className="mt-1 text-sm text-red-600">{errors.model}</p>
            )}
          </div>
          
          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={vehicle.year}
              onChange={handleInputChange}
              min="1900"
              max={new Date().getFullYear() + 1}
              className={`w-full px-3 py-2 border ${
                errors.year ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            {errors.year && (
              <p className="mt-1 text-sm text-red-600">{errors.year}</p>
            )}
          </div>
          
          {/* Color */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              id="color"
              name="color"
              value={vehicle.color}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${
                errors.color ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
              placeholder="e.g., Black, Silver"
            />
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">{errors.color}</p>
            )}
          </div>
          
          {/* License Plate (optional) */}
          <div>
            <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
              License Plate (optional)
            </label>
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              value={vehicle.licensePlate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., ABC-1234"
            />
          </div>
          
          {/* Max Weight (optional) */}
          <div>
            <label htmlFor="maxWeight" className="block text-sm font-medium text-gray-700 mb-1">
              Max Weight (kg/lbs) (optional)
            </label>
            <input
              type="text"
              id="maxWeight"
              name="maxWeight"
              value={vehicle.maxWeight}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 100"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Add Vehicle
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;