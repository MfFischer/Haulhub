import React from 'react';

const JobForm = ({
  formData,
  onInputChange,
  onAddressChange,
  onCalculateRoute,
  onSubmit,
  isSubmitting,
  showPriceCalculated
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          What do you need help with?
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          placeholder="e.g., Help moving furniture, Pick up groceries"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Describe your favor request
        </label>
        <textarea
          name="description"
          id="description"
          value={formData.description}
          onChange={onInputChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          placeholder="Provide details about what you need help with..."
          required
        />
      </div>

      <div>
        <label htmlFor="pickup" className="block text-sm font-medium text-gray-700">
          Pickup Location
        </label>
        <input
          type="text"
          name="pickup"
          id="pickup"
          value={formData.pickup}
          onChange={onAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          placeholder="Enter pickup address"
          required
        />
      </div>

      <div>
        <label htmlFor="dropoff" className="block text-sm font-medium text-gray-700">
          Delivery Location
        </label>
        <input
          type="text"
          name="dropoff"
          id="dropoff"
          value={formData.dropoff}
          onChange={onAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          placeholder="Enter delivery address"
          required
        />
      </div>

      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
          Estimated Weight (kg)
        </label>
        <input
          type="number"
          name="weight"
          id="weight"
          min="1"
          max="100"
          value={formData.weight}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isRush"
          id="isRush"
          checked={formData.isRush}
          onChange={onInputChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor="isRush" className="ml-2 block text-sm text-gray-700">
          Need this urgently?
        </label>
      </div>

      <div>
        <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
          Helper's Vehicle Type
        </label>
        <select
          name="vehicleType"
          id="vehicleType"
          value={formData.vehicleType}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="bike">Bike/E-Bike</option>
          <option value="car">Car</option>
          <option value="van">Van</option>
          <option value="truck">Truck</option>
        </select>
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
          Payment Method
        </label>
        <select
          name="paymentMethod"
          id="paymentMethod"
          value={formData.paymentMethod}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="crypto">Crypto (USDC)</option>
          <option value="card">Credit Card</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !showPriceCalculated}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
          (isSubmitting || !showPriceCalculated) ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? 'Creating Favor Request...' : 'Post Favor Request'}
      </button>
    </form>
  );
};

export default JobForm;
