import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
