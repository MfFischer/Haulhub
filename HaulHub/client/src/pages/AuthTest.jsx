import React, { useState } from 'react';
import axios from 'axios';

// This is a diagnostic component to test auth endpoints directly
const AuthTest = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Log what we're about to do
      console.log('Testing login at http://localhost:5001/auth/login');
      
      // Make direct request - no interceptors or additional code
      const response = await axios.post('http://localhost:5001/auth/login', {
        email: 'hauler@example.com',
        password: 'password123'
      });
      
      console.log('Login response:', response);
      setResult(response.data);
    } catch (err) {
      console.error('Login test error:', err);
      setError(err.message + (err.response ? ` (${err.response.status}: ${JSON.stringify(err.response.data)})` : ''));
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Log what we're about to do
      console.log('Testing register at http://localhost:5001/auth/register');
      
      // Make direct request - no interceptors or additional code
      const response = await axios.post('http://localhost:5001/auth/register', {
        name: 'Test User',
        email: `test${Date.now()}@example.com`, // Unique email
        password: 'password123',
        userType: 'hauler'
      });
      
      console.log('Register response:', response);
      setResult(response.data);
    } catch (err) {
      console.error('Register test error:', err);
      setError(err.message + (err.response ? ` (${err.response.status}: ${JSON.stringify(err.response.data)})` : ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Auth API Test</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={testLogin}
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#4338ca', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Test Login
        </button>
        
        <button 
          onClick={testRegister}
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#10b981', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Test Register
        </button>
      </div>
      
      {loading && <p>Testing... please wait</p>}
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '4px', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div style={{ padding: '10px', backgroundColor: '#d1e7dd', color: '#0f5132', borderRadius: '4px' }}>
          <h3>Success!</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AuthTest;