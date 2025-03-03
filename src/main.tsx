import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
// import { registerSW } from 'virtual:pwa-register';

// Skip the service worker registration
// const updateSW = registerSW({
//   onNeedRefresh() {
//     if (confirm('New version available. Reload?')) {
//       updateSW(true);
//     }
//   },
// });

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);