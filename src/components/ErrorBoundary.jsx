import React from 'react';
import * as Sentry from '@sentry/react';

const ErrorBoundary = ({ children }) => (
  <Sentry.ErrorBoundary
    fallback={() => (
      <div>
        <h1>An Error Has Occured</h1>
        <button type="button" onClick={() => Sentry.showReportDialog()}>
          Please click here to Report feedback
        </button>
      </div>
    )}
  >
    {children}
  </Sentry.ErrorBoundary>
);

export default ErrorBoundary;
