import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import RoleToggle from './RoleToggle';
import AuthContext from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const { isAuthenticated, userRole } = useContext(AuthContext);
  
  // Determine which pages should show the role toggle button
  const showRoleToggle = isAuthenticated && ![
    '/profile',
    '/wallet',
    '/my-jobs',
    '/create-job',
    '/login',
    '/register'
  ].includes(pathname);
  
  // Determine which pages should show the full-height layout
  const isFullHeight = ['/hauler-home', '/poster-home'].includes(pathname);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className={`flex-grow ${isFullHeight ? 'flex flex-col' : 'container mx-auto px-4 py-6'}`}>
        {children}
      </main>
      
      {/* Role Toggle Button */}
      {showRoleToggle && <RoleToggle />}
      
      {/* Create Job Button */}
      {isAuthenticated && userRole === 'poster' && pathname !== '/create-job' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <Link
            to="/create-job"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium shadow-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            New Haul Request
          </Link>
        </div>
      )}
    </div>
  );
};

export default Layout;
