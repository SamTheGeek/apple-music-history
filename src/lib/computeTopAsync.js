import Computation from '../components/Computation.js';

let worker = null;
let requestCounter = 0;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/computeTop.worker.js', import.meta.url), {
      type: 'module',
    });
  }
  return worker;
}

const SMALL_DATASET_THRESHOLD = 25_000;

/**
 * Normalize legacy array input vs { playActivityRows, dailyTrackRows }.
 * @param {Record<string, string>[] | { playActivityRows: Record<string, string>[], dailyTrackRows?: Record<string, string>[] | null }} input
 */
function normalizeComputePayload(input) {
  if (Array.isArray(input)) {
    return { playActivityRows: input, dailyTrackRows: null };
  }
  return {
    playActivityRows: input.playActivityRows ?? [],
    dailyTrackRows: input.dailyTrackRows ?? null,
  };
}

/**
 * Run calculateTop off the main thread for large datasets.
 * @param {Record<string, string>[] | { playActivityRows: Record<string, string>[], dailyTrackRows?: Record<string, string>[] | null }} input
 * @param {string[]} excludedSongs
 * @returns {Promise<import('../components/Computation.js').default extends never ? never : object>}
 */
export function computeTopAsync(input, excludedSongs = []) {
  const { playActivityRows, dailyTrackRows } = normalizeComputePayload(input);

  if (playActivityRows.length < SMALL_DATASET_THRESHOLD) {
    return new Promise((resolve) => {
      Computation.calculateTop(playActivityRows, excludedSongs, resolve, { dailyTrackRows });
    });
  }

  return new Promise((resolve, reject) => {
    const w = getWorker();
    const requestId = ++requestCounter;

    const onMessage = (event) => {
      const msg = event.data;
      if (msg.requestId !== requestId) {
        return;
      }
      w.removeEventListener('message', onMessage);
      if (msg.type === 'complete') {
        resolve(msg.results);
      } else {
        reject(new Error(msg.message || 'Computation failed'));
      }
    };

    w.addEventListener('message', onMessage);
    w.postMessage({ playActivityRows, dailyTrackRows, excludedSongs, requestId });
  });
}
