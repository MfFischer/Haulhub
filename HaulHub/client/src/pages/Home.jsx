import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import PricingCalculator from '../components/PricingCalculator';

const Home = () => {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate(userRole === 'hauler' ? '/hauler-home' : '/poster-home');
    }
  }, [isAuthenticated, userRole, navigate]);
  
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-green-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Need a Favor? Haul It for $5
              </h1>
              <p className="text-lg md:text-xl mb-8">
                Connect with friendly neighbors who can help move your stuff. Or help others and earn tips doing favors in your free time!
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/register?role=poster"
                  className="bg-white text-green-800 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold text-center"
                >
                  Ask for Help
                </Link>
                <Link
                  to="/register?role=hauler"
                  className="bg-green-700 hover:bg-green-600 border border-green-600 px-8 py-3 rounded-full font-semibold text-center"
                >
                  Help Others
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 lg:pl-10">
              <img 
                src="/deliver.png" 
                alt="Neighbors helping neighbors" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Payment Options Section - Renamed to Favor Rewards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Earn & Share Your Way</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <img src="/metamask.png" alt="MetaMask" className="h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Quick Tips</h3>
              <p className="text-gray-600">
                Receive instant tips in USDC through MetaMask on Polygon. Stable value, secure payments, and minimal gas fees.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Simple Cash</h3>
              <p className="text-gray-600">
                Use familiar payment methods like PayPal or cards. Easy and straightforward.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Your Preference</h3>
              <p className="text-gray-600">
                Keep earnings in crypto or cash out instantly to your bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Secure & Transparent</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">Blockchain-Powered Trust</h3>
              <p className="text-gray-600 mb-4">
                Every transaction is secured by Polygon's blockchain. Smart contracts ensure safe escrow and automatic payments.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-2">MetaMask SDK Integration</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-2">Smart Contract Escrow</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">Clear Pricing</h3>
              <p className="text-gray-600 mb-4">
                Always $5 base fee + distance. No hidden charges. Tips are optional and go directly to helpers.
              </p>
              <PricingCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Your Local Help Network</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Whether you need help moving something or want to earn tips helping others, our community makes it simple and secure.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register?role=poster"
              className="bg-white text-green-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold"
            >
              Ask for Help
            </Link>
            <Link
              to="/register?role=hauler"
              className="bg-green-800 hover:bg-green-900 border border-green-600 px-8 py-3 rounded-full font-semibold"
            >
              Help Others
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
