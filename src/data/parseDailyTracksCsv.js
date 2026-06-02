import Papa from 'papaparse';
import {
  DAILY_CANONICAL,
  resolveDailyHeader,
  validateDailyTracksHeaders,
} from './schema/playHistoryDailyTracks.js';
import { parseTrackDescription } from './parseTrackDescription.js';

/**
 * @param {string} [s]
 * @returns {string | null} YYYY-MM-DD or null
 */
export function datePlayedToIsoDate(s) {
  if (!s?.trim()) {
    return null;
  }
  const trimmed = s.trim();
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const t = Date.parse(trimmed);
  if (Number.isNaN(t)) {
    return null;
  }
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * @param {Record<string, string>[]} rows
 * @param {string} filterDate YYYY-MM-DD
 * @returns {Record<string, string>[]}
 */
export function filterDailyTracksByStartDate(rows, filterDate) {
  if (!filterDate || filterDate.length < 2 || !rows?.length) {
    return rows ?? [];
  }
  return rows.filter((row) => {
    const iso = datePlayedToIsoDate(row['Date Played']);
    if (!iso) {
      return true;
    }
    return iso >= filterDate;
  });
}

/**
 * @param {Record<string, string>} raw
 * @returns {Record<string, string>}
 */
export function normalizeDailyTrackRow(raw) {
  const out = { ...raw };
  for (const [key, value] of Object.entries(raw)) {
    const canonical = resolveDailyHeader(key);
    if (canonical && canonical !== key) {
      out[canonical] = value;
    }
  }
  const desc = out[DAILY_CANONICAL.trackDescription]?.trim() ?? '';
  const { artist, song, album } = parseTrackDescription(desc);
  const albumCol = out[DAILY_CANONICAL.albumName]?.trim();
  out[DAILY_CANONICAL.songName] = song || desc;
  out[DAILY_CANONICAL.artistName] = artist;
  if (!albumCol && album) {
    out[DAILY_CANONICAL.albumName] = album;
  }
  return out;
}

/**
 * @param {Record<string, string>[]} rows
 * @returns {Record<string, string>[]}
 */
export function normalizeDailyTrackRows(rows) {
  return rows.map(normalizeDailyTrackRow);
}

/**
 * @param {string} csvText
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<Record<string, string>[]>}
 */
export function parseDailyTracksCsv(csvText, onProgress) {
  onProgress?.({ phase: 'parsing', percent: 0 });

  return new Promise((resolve, reject) => {
    const rows = [];
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      step(results) {
        if (results.data) {
          rows.push(results.data);
        }
      },
      complete() {
        onProgress?.({ phase: 'parsing', percent: 100 });
        resolve(normalizeDailyTrackRows(rows));
      },
      error(err) {
        reject(new Error(err.message || 'Failed to parse daily tracks CSV'));
      },
    });
  });
}

/**
 * @param {string[]} headers
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateDailyTracksRowsFromHeaders(headers) {
  if (!headers || headers.length === 0) {
    return { ok: false, message: 'The daily tracks file has no column headers.' };
  }
  const v = validateDailyTracksHeaders(headers);
  if (!v.ok) {
    return { ok: false, message: v.message ?? 'Invalid daily tracks headers.' };
  }
  return { ok: true };
}

/**
 * @param {Record<string, string>[]} rows
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateDailyTracksRows(rows) {
  if (!rows || rows.length === 0) {
    return { ok: false, message: 'The daily tracks file contains no data rows.' };
  }
  const headers = Object.keys(rows[0] ?? {});
  return validateDailyTracksRowsFromHeaders(headers);
}
