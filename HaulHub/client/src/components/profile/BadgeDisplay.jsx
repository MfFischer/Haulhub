import React from 'react';

/**
 * Component to display user badges as NFTs
 * 
 * @param {Object} props
 * @param {Array} props.badges - Array of badge objects
 * @returns {JSX.Element}
 */
const BadgeDisplay = ({ badges = [] }) => {
  // Badge type names and colors
  const badgeTypes = {
    0: { name: 'Speed Demon', color: 'bg-yellow-100 text-yellow-800', icon: '⚡' },
    1: { name: 'Eco Warrior', color: 'bg-green-100 text-green-800', icon: '🌱' },
    2: { name: 'Load Lord', color: 'bg-purple-100 text-purple-800', icon: '🏋️' },
    3: { name: 'Frequent Hauler', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
    4: { name: 'Reliable Hauler', color: 'bg-red-100 text-red-800', icon: '✓' },
    5: { name: 'Quick Claimer', color: 'bg-indigo-100 text-indigo-800', icon: '⏱️' }
  };
  
  // Function to generate badge level stars
  const renderLevelStars = (level) => {
    return Array(level)
      .fill()
      .map((_, i) => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ));
  };
  
  // Show message if no badges
  if (!badges || badges.length === 0) {
    return (
      <div className="bg-gray-50 p-8 text-center rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No badges yet</h3>
        <p className="mt-1 text-gray-500">Complete jobs to earn badges!</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {badges.map((badge) => {
          const badgeType = badgeTypes[badge.type] || { 
            name: 'Unknown Badge', 
            color: 'bg-gray-100 text-gray-800',
            icon: '?'
          };
          
          return (
            <div key={badge.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Badge header */}
              <div className={`px-4 py-3 ${badgeType.color} font-medium flex justify-between items-center`}>
                <span className="flex items-center">
                  <span className="mr-2 text-lg">{badgeType.icon}</span>
                  {badgeType.name}
                </span>
                <div className="flex">
                  {renderLevelStars(badge.level)}
                </div>
              </div>
              
              {/* Badge content */}
              <div className="p-4 bg-white">
                <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {badge.metadata?.image ? (
                    <img 
                      src={badge.metadata.image}
                      alt={badge.metadata.name || badgeType.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-4xl">{badgeType.icon}</div>
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-gray-900 mb-1">
                  {badge.metadata?.name || `${badgeType.name} Badge`}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {badge.metadata?.description || `Level ${badge.level} ${badgeType.name} achievement`}
                </p>
                
                <div className="text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Issued:</span>
                    <span>{new Date(badge.issuedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Token ID:</span>
                    <span className="font-mono">{badge.id}</span>
                  </div>
                </div>
                
                {/* View on blockchain button */}
                <a
                  href={`https://mumbai.polygonscan.com/token/${badge.contractAddress}?a=${badge.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex justify-center items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  View on Polygon
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeDisplay;