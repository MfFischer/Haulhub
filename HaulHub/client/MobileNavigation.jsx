import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

// Import icons
import { 
  FaHome, 
  FaClipboardList, 
  FaPlus, 
  FaWallet, 
  FaUserAlt 
} from 'react-icons/fa';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isHauler = user?.userType === 'hauler';
  
  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex justify-around items-center px-2 py-1 md:hidden">
      {/* Home - Different for haulers and posters */}
      <Link 
        to={isHauler ? '/hauler-home' : '/poster-home'} 
        className={`flex flex-col items-center p-2 text-xs ${
          isActive(isHauler ? '/hauler-home' : '/poster-home') 
            ? 'text-haulhub-primary' 
            : 'text-gray-500'
        }`}
      >
        <FaHome className="text-lg mb-1" />
        <span>Home</span>
      </Link>
      
      {/* My Jobs */}
      <Link 
        to="/my-jobs" 
        className={`flex flex-col items-center p-2 text-xs ${
          isActive('/my-jobs') ? 'text-haulhub-primary' : 'text-gray-500'
        }`}
      >
        <FaClipboardList className="text-lg mb-1" />
        <span>My Jobs</span>
      </Link>
      
      {/* Create Job - Only for posters */}
      {!isHauler && (
        <Link 
          to="/create-job" 
          className={`flex flex-col items-center p-2 text-xs ${
            isActive('/create-job') ? 'text-haulhub-primary' : 'text-gray-500'
          }`}
        >
          <div className="bg-haulhub-primary text-white rounded-full p-3 -mt-5 mb-1 shadow-md">
            <FaPlus className="text-lg" />
          </div>
          <span>Post Job</span>
        </Link>
      )}
      
      {/* Wallet */}
      <Link 
        to="/wallet" 
        className={`flex flex-col items-center p-2 text-xs ${
          isActive('/wallet') ? 'text-haulhub-primary' : 'text-gray-500'
        }`}
      >
        <FaWallet className="text-lg mb-1" />
        <span>Wallet</span>
      </Link>
      
      {/* Profile */}
      <Link 
        to="/profile" 
        className={`flex flex-col items-center p-2 text-xs ${
          isActive('/profile') ? 'text-haulhub-primary' : 'text-gray-500'
        }`}
      >
        <FaUserAlt className="text-lg mb-1" />
        <span>Profile</span>
      </Link>
    </nav>
  );
};

export default MobileNavigation;