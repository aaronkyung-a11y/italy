import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// PWA Service Worker registration (vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New SW detected & waiting — force activate + reload
    console.log('[Docent] New version available, reloading...');
    // Brief delay so user sees the message (if visible) before reload
    setTimeout(() => updateSW(true), 300);
  },
  onOfflineReady() {
    console.log('[Docent] App ready for offline use');
  },
  onRegistered(registration) {
    if (registration) {
      console.log('[Docent] Service Worker registered');
      // Poll for updates every 60 seconds while app is open
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 1000);
    }
  },
  onRegisterError(err) {
    console.error('[Docent] SW registration failed:', err);
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
