import React, { lazy, Suspense, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Banner from './components/Banner';
import Footer from './components/footer';
import ErrorBoundary from './components/ErrorBoundary';

const Results = lazy(() => import('./components/Results'));

function App() {
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState(null);

  let appToLoad;

  const hasReport =
    data &&
    typeof data === 'object' &&
    Array.isArray(data.playActivityRows) &&
    data.playActivityRows.length > 0;

  if (hasReport) {
    appToLoad = (
      <Suspense
        fallback={
          <div className="loading-panel" aria-busy="true">
            <p className="lead" style={{ textAlign: 'center' }}>
              Loading report…
            </p>
            <div className="sk-fading-circle">
              <div className="sk-circle1 sk-circle" />
              <div className="sk-circle2 sk-circle" />
              <div className="sk-circle3 sk-circle" />
              <div className="sk-circle4 sk-circle" />
              <div className="sk-circle5 sk-circle" />
              <div className="sk-circle6 sk-circle" />
              <div className="sk-circle7 sk-circle" />
              <div className="sk-circle8 sk-circle" />
              <div className="sk-circle9 sk-circle" />
              <div className="sk-circle10 sk-circle" />
              <div className="sk-circle11 sk-circle" />
              <div className="sk-circle12 sk-circle" />
            </div>
          </div>
        }
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
