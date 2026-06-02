import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Banner from './components/Banner';
import Results from './components/Results';
import Footer from './components/footer';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState(null);

  let appToLoad;

  if (data.length > 0) {
    appToLoad = <Results data={data} />;
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
