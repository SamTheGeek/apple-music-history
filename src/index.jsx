import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import * as Sentry from '@sentry/react';

Sentry.init({
    dsn: "https://5a944e1a8e444067b60244235f6878bf@o4504362701291520.ingest.sentry.io/4504362703257600"
});

const root = createRoot(document.getElementById('root'));
root.render(<App />);
