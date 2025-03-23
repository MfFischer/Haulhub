import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout and Pages
import Layout from './components/common/Layout';
import Home from './pages/Home';
import HaulerHome from './pages/HaulerHome';
import PosterHome from './pages/PosterHome';
import MyJobs from './pages/MyJobs';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import NotFound from './pages/NotFound';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { WalletProvider } from './context/WalletContext';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      try {
        // Load any necessary resources or configuration
        await Promise.all([
          // Any initialization promises go here
          new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
        ]);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-white">Loading HaulHub...</h2>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <WalletProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/hauler" element={<HaulerHome />} />
                <Route path="/poster" element={<PosterHome />} />
                <Route path="/jobs" element={<MyJobs />} />
                <Route path="/jobs/:jobId" element={<JobDetail />} />
                <Route path="/create-job" element={<CreateJob />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Layout>
            <ToastContainer position="bottom-right" theme="dark" />
          </WalletProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;