import Computation from '../components/Computation.js';

self.onmessage = (event) => {
  const { data, excludedSongs, requestId } = event.data;

  try {
    Computation.calculateTop(data, excludedSongs ?? [], (results) => {
      self.postMessage({ type: 'complete', requestId, results });
    });
  } catch (err) {
    self.postMessage({
      type: 'error',
      requestId,
      message: err instanceof Error ? err.message : 'Computation failed',
    });
  }
};
