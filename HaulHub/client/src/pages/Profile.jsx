import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import WalletContext from '../context/WalletContext';
import Loading from '../components/common/Loading';
import Alert from '../components/common/Alert';
import BadgeDisplay from '../components/profile/BadgeDisplay';
import VehicleForm from '../components/profile/VehicleForm';
import api from '../utils/api';

const Profile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: null,
    preferredRole: 'hauler',
    notificationsEnabled: true,
    vehicles: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'vehicles', 'badges', 'settings'
  const [badges, setBadges] = useState([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const { isAuthenticated, currentUser, updateProfile, logout } = useContext(AuthContext);
  const { isConnected, account, getUserBadges } = useContext(WalletContext);
  
  const navigate = useNavigate();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.warn('Please log in to view your profile');
      navigate('/login', { state: { returnUrl: '/profile' } });
      return;
    }
    
    // Load user profile data
    loadUserData();
  }, [isAuthenticated, navigate]);
  
  // Load user badges if wallet is connected
  useEffect(() => {
    if (isConnected && getUserBadges && activeTab === 'badges') {
      loadUserBadges();
    }
  }, [isConnected, getUserBadges, activeTab]);
  
  // Load user data
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/me');
      const userData = response.data;
      
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        profileImage: userData.profileImage || null,
        preferredRole: userData.preferredRole || 'hauler',
        notificationsEnabled: userData.notificationsEnabled !== false,
        vehicles: userData.vehicles || []
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load user badges
  const loadUserBadges = async () => {
    try {
      const badgeData = await getUserBadges(account);
      setBadges(badgeData);
    } catch (error) {
      console.error('Error loading badges:', error);
      toast.error('Failed to load badges');
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profileImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await updateProfile(formData);
      
      if (success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.post('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.response?.status === 401) {
        setErrors({
          currentPassword: 'Current password is incorrect'
        });
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle password data change
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle adding a vehicle
  const handleAddVehicle = (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, vehicle]
    }));
  };
  
  // Handle removing a vehicle
  const handleRemoveVehicle = (index) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }));
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.delete('/users/me');
      toast.success('Your account has been deleted');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <Loading message="Loading profile..." />;
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile Info
              </button>
              
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vehicles'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vehicles
              </button>
              
              <button
                onClick={() => setActiveTab('badges')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'badges'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Badges
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Account Settings
              </button>
            </nav>
          </div>
          
          {/* Profile Information */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Profile Image */}
                <div>
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="h-40 w-40 rounded-full overflow-hidden bg-gray-200">
                        {formData.profileImage ? (
                          <img
                            src={formData.profileImage}
                            alt={formData.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-gray-400">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <label
                        htmlFor="profileImage"
                        className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                          type="file"
                          id="profileImage"
                          name="profileImage"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload a profile photo (optional)
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Role
                    </label>
                    <div className="mt-2 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="hauler"
                          name="preferredRole"
                          type="radio"
                          value="hauler"
                          checked={formData.preferredRole === 'hauler'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <label htmlFor="hauler" className="ml-3 block text-sm font-medium text-gray-700">
                          Hauler (Deliver items and earn money)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="poster"
                          name="preferredRole"
                          type="radio"
                          value="poster"
                          checked={formData.preferredRole === 'poster'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <label htmlFor="poster" className="ml-3 block text-sm font-medium text-gray-700">
                          Poster (Request item deliveries)
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center">
                      <input
                        id="notificationsEnabled"
                        name="notificationsEnabled"
                        type="checkbox"
                        checked={formData.notificationsEnabled}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notificationsEnabled" className="ml-3 block text-sm font-medium text-gray-700">
                        Enable notifications
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Receive alerts for new jobs, status updates, and more.
                    </p>
                  </div>
                </div>
                
                {/* Right Column - Profile Details */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number (optional)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                        Bio (optional)
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Tell others a bit about yourself..."
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </div>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
          
          {/* Vehicles */}
          {activeTab === 'vehicles' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Your Vehicles</h2>
                <p className="text-gray-600">
                  Add the vehicles you use for deliveries. You can select which vehicle to use when accepting a job.
                </p>
              </div>
              
              {formData.vehicles.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No vehicles added yet</h3>
                  <p className="mt-1 text-gray-500">Add a vehicle to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 relative">
                      <button
                        onClick={() => handleRemoveVehicle(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        aria-label="Remove vehicle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          {vehicle.type === 'car' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                          ) : vehicle.type === 'bike' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">{vehicle.type}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Year</p>
                          <p className="font-medium">{vehicle.year}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Color</p>
                          <p className="font-medium capitalize">{vehicle.color}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">License Plate</p>
                          <p className="font-medium">{vehicle.licensePlate || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Max Weight</p>
                          <p className="font-medium">{vehicle.maxWeight || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <VehicleForm onAddVehicle={handleAddVehicle} />
            </div>
          )}
          
          {/* Badges */}
          {activeTab === 'badges' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Your Achievement Badges</h2>
                <p className="text-gray-600">
                  Badges are NFTs earned by completing jobs and achieving milestones in the HaulHub app.
                </p>
              </div>
              
              {!isConnected ? (
                <Alert
                  type="info"
                  title="Connect Your Wallet"
                  message="Connect your crypto wallet to view and manage your badges. Badges are stored as NFTs on the Polygon blockchain."
                  action={{
                    label: 'Connect Wallet',
                    onClick: () => navigate('/wallet')
                  }}
                />
              ) : (
                <BadgeDisplay badges={badges} />
              )}
            </div>
          )}
          
          {/* Account Settings */}
          {activeTab === 'settings' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Account Settings</h2>
                <p className="text-gray-600">
                  Manage your account security and preferences.
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Password
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p>Change your account password.</p>
                    </div>
                    
                    {showPasswordForm ? (
                      <form onSubmit={handlePasswordChange} className="mt-5">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                              Current Password
                            </label>
                            <input
                              type="password"
                              name="currentPassword"
                              id="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordInputChange}
                              className={`mt-1 block w-full border ${
                                errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                              } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                            />
                            {errors.currentPassword && (
                              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                              New Password
                            </label>
                            <input
                              type="password"
                              name="newPassword"
                              id="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordInputChange}
                              className={`mt-1 block w-full border ${
                                errors.newPassword ? 'border-red-300' : 'border-gray-300'
                              } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                            />
                            {errors.newPassword && (
                              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              name="confirmPassword"
                              id="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordInputChange}
                              className={`mt-1 block w-full border ${
                                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                              } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                            />
                            {errors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-5 flex space-x-3">
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </>
                            ) : (
                              'Change Password'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPasswordForm(false)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(true)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Change Password
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Delete Account */}
                <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-red-800">
                      Delete Account
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-red-600">
                      <p>
                        Once you delete your account, all of your data will be permanently removed.
                        This action cannot be undone.
                      </p>
                    </div>
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          'Delete Account'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;