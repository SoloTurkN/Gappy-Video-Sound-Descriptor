import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'sonner';

// If a user lands on the static CDN snapshot (frontend-only, no backend), bounce
// them to the live preview URL where the backend also lives. The static
// deployment has no /api endpoints, so it can never work cross-origin.
if (typeof window !== 'undefined' && window.location.hostname.includes('.preview.static.emergentagent.com')) {
  const correctHost = window.location.hostname.replace('.preview.static.', '.preview.');
  window.location.replace(`${window.location.protocol}//${correctHost}${window.location.pathname}${window.location.search}${window.location.hash}`);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" richColors />
  </React.StrictMode>
);
