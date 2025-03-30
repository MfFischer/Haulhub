import React, { useState } from 'react';
import axios from 'axios';

const AuthTestFull = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api/auth/test');
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    email: 'hauler@example.com',
    password: 'password123'
  }, null, 2));

  const makeRequest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Log what we're about to do
      console.log(`Making ${method} request to: http://localhost:5001${endpoint}`);
      console.log('Request body:', requestBody);
      
      // Parse body if needed
      let parsedBody = null;
      if (requestBody && (method === 'POST' || method === 'PUT')) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }
      
      // Make direct request - no interceptors or additional code
      let response;
      switch (method) {
        case 'GET':
          response = await axios.get(`http://localhost:5001${endpoint}`);
          break;
        case 'POST':
          response = await axios.post(`http://localhost:5001${endpoint}`, parsedBody);
          break;
        case 'PUT':
          response = await axios.put(`http://localhost:5001${endpoint}`, parsedBody);
          break;
        default:
          response = await axios.get(`http://localhost:5001${endpoint}`);
      }
      
      console.log('Response:', response);
      setResult(response.data);
    } catch (err) {
      console.error('Request error:', err);
      setError(err.message + (err.response ? ` (${err.response.status}: ${JSON.stringify(err.response.data)})` : ''));
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    {
      name: 'Auth Test',
      method: 'GET',
      endpoint: '/api/auth/test',
      body: '{}'
    },
    {
      name: 'Login (Test Hauler)',
      method: 'POST',
      endpoint: '/api/auth/login',
      body: JSON.stringify({
        email: 'hauler@example.com',
        password: 'password123'
      }, null, 2)
    },
    {
      name: 'Login (Test Poster)',
      method: 'POST',
      endpoint: '/api/auth/login',
      body: JSON.stringify({
        email: 'poster@example.com',
        password: 'password123'
      }, null, 2)
    },
    {
      name: 'Register (New User)',
      method: 'POST',
      endpoint: '/api/auth/register',
      body: JSON.stringify({
        name: 'New Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        userType: 'hauler'
      }, null, 2)
    }
  ];

  const applyPreset = (preset) => {
    setMethod(preset.method);
    setEndpoint(preset.endpoint);
    setRequestBody(preset.body);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Auth API Test Tool</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Presets</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {presets.map((preset, index) => (
            <button 
              key={index}
              onClick={() => applyPreset(preset)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#4338ca', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Request Method:</label>
          <select 
            value={method} 
            onChange={(e) => setMethod(e.target.value)}
            style={{ 
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '100%'
            }}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Endpoint:</label>
          <input 
            type="text" 
            value={endpoint} 
            onChange={(e) => setEndpoint(e.target.value)}
            style={{ 
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '100%'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Request Body (JSON):</label>
          <textarea 
            value={requestBody} 
            onChange={(e) => setRequestBody(e.target.value)}
            rows={10}
            style={{ 
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '100%',
              fontFamily: 'monospace'
            }}
          />
        </div>
        
        <button 
          onClick={makeRequest}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#10b981', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            width: '100%',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Sending Request...' : 'Send Request'}
        </button>
      </div>
      
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #f87171'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d1fae5', 
          color: '#047857', 
          borderRadius: '4px',
          border: '1px solid #34d399'
        }}>
          <h3 style={{ marginTop: 0 }}>Response:</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: '10px',
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'monospace'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthTestFull;
