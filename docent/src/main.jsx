import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// PWA Service Worker registration (vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) console.log('[Docent] Service Worker registered');
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
