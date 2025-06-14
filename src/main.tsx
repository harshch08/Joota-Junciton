import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'
import React from 'react'

const GOOGLE_CLIENT_ID = '220051092661-aphmcipppgctceau0vkt995v14453572.apps.googleusercontent.com'

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadSuccess={() => console.log('Google OAuth script loaded successfully')}
      onScriptLoadError={() => console.error('Google OAuth script failed to load')}
    >
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
