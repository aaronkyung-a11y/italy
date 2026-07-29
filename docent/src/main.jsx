import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// PWA Service Worker registration (vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register';

// ── One-time reload guard (avoid infinite reload loops) ──
const RELOAD_FLAG = 'docent-sw-reloaded';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New SW detected & waiting — force activate + reload (once)
    console.log('[Docent] New version available, reloading...');
    if (!sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      setTimeout(() => updateSW(true), 300);
    } else {
      // Already reloaded once this session; just activate silently
      updateSW(true);
    }
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

// ── Force-clear stale precache when a new controller takes over ──
// When a new Service Worker activates and takes control, wipe old
// Workbox precache buckets so the fresh index/assets are served.
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    // Drop every cache except runtime image/audio buckets, then reload once
    if (window.caches && caches.keys) {
      caches.keys().then((keys) => {
        const stale = keys.filter(
          (k) => !k.includes('docent-wikimedia') && !k.includes('docent-audio')
        );
        return Promise.all(stale.map((k) => caches.delete(k)));
      }).finally(() => {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
        }
      });
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
