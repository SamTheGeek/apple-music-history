import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import * as Sentry from '@sentry/react';

Sentry.init({
    dsn: "https://5a944e1a8e444067b60244235f6878bf@o4504362701291520.ingest.sentry.io/4504362703257600",
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
// serviceWorker.unregister();
serviceWorker.unregister();
