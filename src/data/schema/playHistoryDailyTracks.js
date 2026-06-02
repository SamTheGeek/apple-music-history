/** @typedef {import('./playHistoryDailyTracksTypes.js').DailyTrackRow} DailyTrackRow */

export const DAILY_TRACKS_SCHEMA_VERSION = '2026.2';

/** Canonical names after normalization */
export const DAILY_CANONICAL = {
  datePlayed: 'Date Played',
  playDurationMs: 'Play Duration Milliseconds',
  trackDescription: 'Track Description',
  playCount: 'Play Count',
  songName: 'Song Name',
  artistName: 'Artist Name',
  albumName: 'Album Name',
};

/** Minimum columns required to aggregate plays */
export const DAILY_REQUIRED_HEADERS = [
  DAILY_CANONICAL.datePlayed,
  DAILY_CANONICAL.playDurationMs,
  DAILY_CANONICAL.trackDescription,
];

export const DAILY_TRACKS_FILE_NAMES = ['apple music - play history daily tracks.csv'];

export function isDailyTracksPath(path) {
  const base = path.split(/[/\\]/).pop()?.toLowerCase() ?? '';
  return DAILY_TRACKS_FILE_NAMES.includes(base);
}

const FIELD_ALIASES = {
  'date played': DAILY_CANONICAL.datePlayed,
  'play duration milliseconds': DAILY_CANONICAL.playDurationMs,
  'track description': DAILY_CANONICAL.trackDescription,
  'play count': DAILY_CANONICAL.playCount,
  'album name': DAILY_CANONICAL.albumName,
};

/**
 * @param {string} header
 * @returns {string | null}
 */
export function resolveDailyHeader(header) {
  if (!header) {
    return null;
  }
  const t = header.trim();
  if (Object.values(DAILY_CANONICAL).includes(t)) {
    return t;
  }
  return FIELD_ALIASES[t.toLowerCase()] ?? null;
}

/**
 * @param {string[]} headers
 * @returns {{ ok: boolean, message?: string }}
 */
export function validateDailyTracksHeaders(headers) {
  const normalized = new Set(headers.map((h) => resolveDailyHeader(h) || h.trim()));
  const missing = DAILY_REQUIRED_HEADERS.filter((f) => !normalized.has(f));
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Apple Music - Play History Daily Tracks.csv is missing columns: ${missing.join(', ')}`,
    };
  }
  return { ok: true };
}
