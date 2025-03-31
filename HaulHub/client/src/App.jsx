import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { 
  useState, 
  useEffect 
} from 'react';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { LocationProvider } from './context/LocationContext';
import Header from './components/common/Header';

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
import AuthTest from './pages/AuthTest';
import MapTest from './pages/MapTest';
import { BasicMap } from './pages/BasicMap';
import AuthTestFull from './pages/AuthTestFull';

// Import components
import Layout from './components/common/Layout';
import Loading from './components/common/Loading';

// Protected route wrapper component
const ProtectedRoute = ({ children, userType = null }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const currentUserType = localStorage.getItem('userType');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (userType && currentUserType !== userType) {
    return <Navigate to={currentUserType === 'hauler' ? '/hauler-home' : '/poster-home'} replace />;
  }
  
  return children;
};

const App = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
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
            <div className="app">
              <Header />
              <Layout>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home isMobile={isMobile} />} />
                  <Route path="/login" element={<Login isMobile={isMobile} />} />
                  <Route path="/register" element={<Register isMobile={isMobile} />} />
                  <Route path="/auth-test" element={<AuthTest />} />
                  <Route path="/map-test" element={<MapTest />} />
                  <Route path="/basic-map" element={<BasicMap />} />
                  <Route path="/auth-test-full" element={<AuthTestFull />} />
                  
                  {/* Protected routes - Hauler */}
                  <Route 
                    path="/hauler-home" 
                    element={
                      <ProtectedRoute userType="hauler">
                        <HaulerHome isMobile={isMobile} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Protected routes - Poster */}
                  <Route 
                    path="/poster-home" 
                    element={
                      <ProtectedRoute userType="poster">
                        <PosterHome isMobile={isMobile} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/create-job" 
                    element={
                      <ProtectedRoute userType="poster">
                        <CreateJob isMobile={isMobile} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Protected routes - Both user types */}
                  <Route 
                    path="/my-jobs" 
                    element={
                      <ProtectedRoute>
                        <MyJobs isMobile={isMobile} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/job/:id" 
                    element={
                      <ProtectedRoute>
                        <JobDetail isMobile={isMobile} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile isMobile={isMobile} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/wallet" 
                    element={
                      <ProtectedRoute>
                        <Wallet isMobile={isMobile} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* 404 route */}
                  <Route path="*" element={<NotFound isMobile={isMobile} />} />
                </Routes>
              </Layout>
            </div>
          </WalletProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
