import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const RoleToggle = () => {
  const { userRole, toggleRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleToggle = () => {
    // Toggle the role
    toggleRole();
    
    // Navigate to appropriate page based on new role
    if (userRole === 'hauler') {
      // If currently hauler, will change to poster
      navigate('/poster');
    } else {
      // If currently poster, will change to hauler
      navigate('/hauler');
    }
  };
  
  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center z-30"
    >
      <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-green-600 font-bold text-sm mr-2">
        {userRole === 'hauler' ? 'H' : 'P'}
      </span>
      <span className="mr-1">Switch to</span>
      <strong>{userRole === 'hauler' ? 'Poster' : 'Hauler'} Mode</strong>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
    </button>
  );
};

export default RoleToggle;