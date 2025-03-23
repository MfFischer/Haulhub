import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app with StrictMode for development checks
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. This comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // When a new version is available
    const waitingServiceWorker = registration.waiting;
    
    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener("statechange", (event) => {
        if (event.target.state === "activated") {
          // New content is available, refresh the page
          if (window.confirm("New version available! Refresh to update?")) {
            window.location.reload();
          }
        }
      });
      
      // Trigger the statechange listener
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    }
  },
  onSuccess: (registration) => {
    console.log('Service Worker registered successfully!');
  }
});

// Event listener for offline/online status
window.addEventListener('online', () => {
  document.body.classList.remove('offline-mode');
  // Optional: Show a "back online" notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('HaulHub', {
      body: 'You are back online!',
      icon: '/logo192.png'
    });
  }
});

window.addEventListener('offline', () => {
  document.body.classList.add('offline-mode');
  // Optional: Show an "offline" notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('HaulHub', {
      body: 'You are currently offline. Some features may be limited.',
      icon: '/logo192.png'
    });
  }
});

// Request notification permission on page load
if ('Notification' in window && Notification.permission !== 'denied') {
  Notification.requestPermission();
}

// Block navigation when running an active job (for haulers)
window.addEventListener('beforeunload', (event) => {
  const isActiveJobRunning = localStorage.getItem('activeJob');
  
  if (isActiveJobRunning) {
    // Show a confirmation dialog
    event.preventDefault();
    event.returnValue = 'You have an active job in progress. Are you sure you want to leave?';
  }
});