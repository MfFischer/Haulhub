import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { WalletProvider } from './context/WalletContext';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import HaulerHome from './pages/HaulerHome';
import PosterHome from './pages/PosterHome';
import MyJobs from './pages/MyJobs';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import NotFound from './pages/NotFound';

// Import components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Layout from './components/common/Layout';
import Loading from './components/common/Loading';

// Protected route wrapper component
const ProtectedRoute = ({ children, userType = null }) => {
  // Get auth state from context
  const isAuthenticated = localStorage.getItem('token') !== null;
  const currentUserType = localStorage.getItem('userType');
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  if (userType && currentUserType !== userType) {
    // Redirect to appropriate home page if wrong user type
    return <Navigate to={currentUserType === 'hauler' ? '/hauler-home' : '/poster-home'} replace />;
  }
  
  return children;
};

const App = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if device is mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);
  
  if (isLoading) {
    return <Loading />;
  }
  
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <WalletProvider>
            <div className="app-container">
              <Header isMobile={isMobile} />
              
              <main className="main-content">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home isMobile={isMobile} />} />
                  <Route path="/login" element={<Login isMobile={isMobile} />} />
                  <Route path="/register" element={<Register isMobile={isMobile} />} />
                  
                  {/* Protected routes - Hauler */}
                  <Route 
                    path="/hauler-home" 
                    element={
                      <ProtectedRoute userType="hauler">
                        <Layout isMobile={isMobile}>
                          <HaulerHome isMobile={isMobile} />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Protected routes - Poster */}
                  <Route 
                    path="/poster-home" 
                    element={
                      <ProtectedRoute userType="poster">
                        <Layout isMobile={isMobile}>
                          <PosterHome isMobile={isMobile} />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/create-job" 
                    element={
                      <ProtectedRoute userType="poster">
                        <Layout isMobile={isMobile}>
                          <CreateJob isMobile={isMobile} />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Protected routes - Both user types */}
                  <Route 
                    path="/my-jobs" 
                    element={
                      <ProtectedRoute>
                        <Layout isMobile={isMobile}>
                          <MyJobs isMobile={isMobile} />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/job/:id" 
                    element={
                      <ProtectedRoute>
                        <Layout isMobile={isMobile}>
                          <JobDetail isMobile={isMobile} />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Layout isMobile={isMobile}>
                          <Profile isMobile={isMobile} />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/wallet" 
                    element={
                      <ProtectedRoute>
                        <Layout isMobile={isMobile}>
                          <Wallet isMobile={isMobile} />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* 404 route */}
                  <Route path="*" element={<NotFound isMobile={isMobile} />} />
                </Routes>
              </main>
              
              <Footer isMobile={isMobile} />
            </div>
          </WalletProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;