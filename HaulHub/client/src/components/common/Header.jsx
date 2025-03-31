import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import WalletContext from '../../context/WalletContext';
import LocationContext from '../../context/LocationContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, isAuthenticated, logout, userRole } = useContext(AuthContext);
  const { isConnected, account, balance, connectWallet } = useContext(WalletContext);
  const { userRegion } = useContext(LocationContext);
  const navigate = useNavigate();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  
  const handleLogout = () => {
    logout();
    navigate('/');
    closeMenu();
  };
  
  // Format account address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Determine currency symbol based on user's region
  const getCurrencySymbol = () => {
    const symbols = {
      'us': '$',
      'ph': '₱',
      'id': 'Rp',
      'vn': '₫',
      'eu': '€',
      'uk': '£',
      'ca': 'C$'
    };
    return symbols[userRegion] || '$';
  };
  
  return (
    <header className="bg-green-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold flex items-center" onClick={closeMenu}>
            <img 
              src="/Microsender-white.png" 
              alt="Microsendr Logo" 
              className="h-8 mr-2"
            />
            Microsendr
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {isAuthenticated ? (
              <>
                <Link to={userRole === 'hauler' ? '/hauler-home' : '/poster-home'} className="hover:text-green-200 transition-colors">
                  {userRole === 'hauler' ? 'Available Favors' : 'Ask for a Favor'}
                </Link>
                <Link to="/my-jobs" className="hover:text-green-200 transition-colors">My Favors</Link>
                <Link to="/wallet" className="hover:text-green-200 transition-colors">Tips & Earnings</Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 hover:text-green-200 transition-colors">
                    <span>{currentUser?.name || 'Account'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Profile</Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
                
                {/* Wallet Status */}
                {isConnected ? (
                  <div className="bg-green-700 rounded-full py-1 px-3 flex items-center text-sm">
                    <span className="mr-2">{parseFloat(balance.matic).toFixed(2)} MATIC</span>
                    <span className="text-xs text-green-300">{formatAddress(account)}</span>
                  </div>
                ) : (
                  <button 
                    onClick={connectWallet}
                    className="bg-green-600 hover:bg-green-700 rounded-full py-1 px-3 text-sm transition-colors"
                  >
                    Connect Wallet
                  </button>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-green-200 transition-colors">Login</Link>
                <Link to="/register" className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded-full transition-colors">
                  Join Community
                </Link>
              </>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <button className="md:hidden" onClick={toggleMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-green-700">
            <nav className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <>
                  <Link to={userRole === 'hauler' ? '/hauler-home' : '/poster-home'} className="hover:text-green-200 transition-colors" onClick={closeMenu}>
                    {userRole === 'hauler' ? 'Available Favors' : 'Ask for a Favor'}
                  </Link>
                  <Link to="/my-jobs" className="hover:text-green-200 transition-colors" onClick={closeMenu}>My Favors</Link>
                  <Link to="/wallet" className="hover:text-green-200 transition-colors" onClick={closeMenu}>Tips & Earnings</Link>
                  <Link to="/profile" className="hover:text-green-200 transition-colors" onClick={closeMenu}>Profile</Link>
                  
                  {/* Wallet Status - Mobile */}
                  {isConnected ? (
                    <div className="bg-green-700 rounded-lg py-2 px-3 flex justify-between items-center text-sm">
                      <span>{parseFloat(balance.matic).toFixed(2)} MATIC</span>
                      <span className="text-xs text-green-300">{formatAddress(account)}</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { connectWallet(); closeMenu(); }}
                      className="bg-green-600 hover:bg-green-700 rounded-lg py-2 px-3 text-center text-sm transition-colors"
                    >
                      Connect Wallet
                    </button>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="border border-green-600 rounded-lg py-2 px-3 text-center hover:bg-green-700 transition-colors mt-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-green-200 transition-colors" onClick={closeMenu}>Login</Link>
                  <Link 
                    to="/register" 
                    className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg text-center transition-colors"
                    onClick={closeMenu}
                  >
                    Join Community
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
      
      {/* Role Indicator */}
      {isAuthenticated && (
        <div className="bg-green-700 py-2">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="text-sm flex items-center">
              <span className="font-medium mr-2">You're:</span>
              <span className="bg-green-600 px-2 py-0.5 rounded-full text-xs">
                {userRole === 'hauler' ? 'Helping Others' : 'Requesting Help'}
              </span>
            </div>
            <div className="text-sm flex items-center">
              <span className="font-medium mr-2">Area:</span>
              <span className="bg-green-600 px-2 py-0.5 rounded-full text-xs">
                {userRegion.toUpperCase()} ({getCurrencySymbol()})
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
