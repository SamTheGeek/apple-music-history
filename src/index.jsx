import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import * as Sentry from '@sentry/react';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn });
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
