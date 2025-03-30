import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Define location API endpoints
export const locationAPI = {
  getRegion: (lat, lng) => api.get(`/location/region?lat=${lat}&lng=${lng}`),
  reverseGeocode: (lat, lng) => api.get(`/location/reverse-geocode?latitude=${lat}&longitude=${lng}`),
  geocode: (address) => api.get(`/location/geocode?address=${encodeURIComponent(address)}`),
  getJobRoute: (pickupLat, pickupLng, dropoffLat, dropoffLng) => 
    api.get(`/location/job-route?pickupLat=${pickupLat}&pickupLng=${pickupLng}&dropoffLat=${dropoffLat}&dropoffLng=${dropoffLng}`),
  getNearbyHaulers: (lat, lng, radius) => 
    api.get(`/location/nearby-haulers?latitude=${lat}&longitude=${lng}&radius=${radius}`)
};

// Define job API endpoints
export const jobsAPI = {
  getAvailable: (lat, lng) => api.get(`/jobs/available?lat=${lat}&lng=${lng}`),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (jobData) => api.post('/jobs', jobData),
  claim: (id, userId) => api.post(`/jobs/${id}/claim`, { userId }),
  complete: (id, userId) => api.post(`/jobs/${id}/complete`, { userId })
};

export default api;
