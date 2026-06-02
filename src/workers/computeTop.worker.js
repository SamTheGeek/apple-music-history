import Computation from '../components/Computation.js';

self.onmessage = (event) => {
  const { playActivityRows, dailyTrackRows, excludedSongs, requestId } = event.data;

  try {
    Computation.calculateTop(playActivityRows ?? [], excludedSongs ?? [], (results) => {
      self.postMessage({ type: 'complete', requestId, results });
    }, { dailyTrackRows: dailyTrackRows ?? null });
  } catch (err) {
    self.postMessage({
      type: 'error',
      requestId,
      message: err instanceof Error ? err.message : 'Computation failed',
    });
  }
};
