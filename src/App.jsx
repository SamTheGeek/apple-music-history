import React, { lazy, Suspense, useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Banner from './components/Banner';
import Footer from './components/footer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingPanel from './components/LoadingPanel';

const Results = lazy(() => import('./components/Results'));

function App() {
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = mq.matches;
      document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', dark ? '#16141a' : '#ebe8e3');
      }
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  let appToLoad;

  const hasReport =
    data &&
    typeof data === 'object' &&
    Array.isArray(data.playActivityRows) &&
    data.playActivityRows.length > 0;

  if (hasReport) {
    appToLoad = (
      <Suspense
        fallback={<LoadingPanel as="p" className="lead" text="Loading report…" />}
      >
        <Results data={data} />
      </Suspense>
    );
  } else {
    appToLoad = (
      <>
        {loadError && (
          <div className="errorDiv box load-error" role="alert">
            {loadError}
          </div>
        )}
        <Banner
          dataResponseHandler={(rows) => {
            setLoadError(null);
            setData(rows);
          }}
          onError={setLoadError}
        />
      </>
    );
  }

  return (
    <div className="App">
      <ErrorBoundary>{appToLoad}</ErrorBoundary>
      <Footer />
    </div>
  );
}

export default App;
