import React from 'react';
import { Link } from 'react-router-dom';

const Footer = ({ isMobile }) => {
  return (
    <footer className="footer p-10 bg-neutral text-neutral-content">
      <div>
        <span className="footer-title">How We Help</span>
        <button className="link link-hover">Local Moving Help</button>
        <button className="link link-hover">Item Transport</button>
        <button className="link link-hover">Real-time Updates</button>
      </div>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div>
            <Link to="/" className="text-xl font-bold flex items-center">
              <img 
                src="/Microsender-white.png" 
                alt="Microsendr Logo" 
                className="h-8 w-8 mr-2"
              />
              Microsendr
            </Link>
            <p className="mt-3 text-gray-400 text-sm">
              Your neighborhood help network for moving items. Fair prices, secure payments, friendly helpers.
            </p>
            
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {/* Instagram SVG path */}
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">X (formerly Twitter)</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/hauler-home" className="text-gray-400 hover:text-white text-sm">
                  Help Others
                </Link>
              </li>
              <li>
                <Link to="/poster-home" className="text-gray-400 hover:text-white text-sm">
                  Request Help
                </Link>
              </li>
              <li>
                <Link to="/my-jobs" className="text-gray-400 hover:text-white text-sm">
                  My Favors
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="text-gray-400 hover:text-white text-sm">
                  Tips & Earnings
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-400 hover:text-white text-sm">
                  Profile & Trust Score
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Community
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/help" className="text-gray-400 hover:text-white text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white text-sm">
                  Common Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white text-sm">
                  Get in Touch
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white text-sm">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Microsendr. Building local help networks.
          </p>
          <p className="text-gray-400 text-sm mt-4 md:mt-0">
            Secured by Polygon Network
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
