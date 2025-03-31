import React, { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const RoleToggle = () => {
  const { userRole, toggleRole } = useContext(AuthContext);
  
  const handleToggle = () => {
    toggleRole();
  };
  
  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center z-30"
    >
      <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-green-600 font-bold text-sm mr-2">
        {userRole === 'hauler' ? 'H' : 'G'} {/* Changed 'P' to 'G' for Giver */}
      </span>
      <span className="mr-1">Switch to</span>
      <strong>{userRole === 'hauler' ? 'Favor Giver' : 'Helper'} Mode</strong>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M15.707 4.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L10 8.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </button>
  );
};

export default RoleToggle;
