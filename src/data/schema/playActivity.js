/** @typedef {import('./playActivityTypes.js').PlayActivityRow} PlayActivityRow */

export const SCHEMA_VERSION = '2026.2';

/** Canonical column names used by Computation.js */
export const CANONICAL_FIELDS = {
  songName: 'Song Name',
  artistName: 'Artist Name',
  playDurationMs: 'Play Duration Milliseconds',
  mediaDurationMs: 'Media Duration In Milliseconds',
  eventEndTimestamp: 'Event End Timestamp',
  eventStartTimestamp: 'Event Start Timestamp',
  utcOffsetSeconds: 'UTC Offset In Seconds',
  endReasonType: 'End Reason Type',
  endPositionMs: 'End Position In Milliseconds',
  startPositionMs: 'Start Position In Milliseconds',
  itemType: 'Item Type',
  mediaType: 'Media Type',
  eventType: 'Event Type',
};

/** Columns that must exist in the CSV header row */
export const REQUIRED_CSV_FIELDS = [
  CANONICAL_FIELDS.songName,
  CANONICAL_FIELDS.playDurationMs,
  CANONICAL_FIELDS.mediaDurationMs,
  CANONICAL_FIELDS.eventEndTimestamp,
  CANONICAL_FIELDS.utcOffsetSeconds,
  CANONICAL_FIELDS.endReasonType,
  CANONICAL_FIELDS.endPositionMs,
  CANONICAL_FIELDS.startPositionMs,
  CANONICAL_FIELDS.itemType,
  CANONICAL_FIELDS.mediaType,
];

/** Legacy exports include this; 2026+ exports may only have Container Artist Name */
export const ARTIST_SOURCE_HEADERS = [
  CANONICAL_FIELDS.artistName,
  'Container Artist Name',
];

/** After normalization every row must have Artist Name (filled during normalize) */
export const REQUIRED_FIELDS = [...REQUIRED_CSV_FIELDS, CANONICAL_FIELDS.artistName];

/** Optional but used for date filtering */
export const OPTIONAL_FIELDS = [CANONICAL_FIELDS.eventStartTimestamp, CANONICAL_FIELDS.eventType];

/**
 * Map alternate header names (lowercase) → canonical name.
 * Extend when Apple renames columns in future exports.
 */
export const FIELD_ALIASES = {
  'song name': CANONICAL_FIELDS.songName,
  'artist name': CANONICAL_FIELDS.artistName,
  'container artist name': CANONICAL_FIELDS.artistName,
  'play duration milliseconds': CANONICAL_FIELDS.playDurationMs,
  'media duration in milliseconds': CANONICAL_FIELDS.mediaDurationMs,
  'event end timestamp': CANONICAL_FIELDS.eventEndTimestamp,
  'event start timestamp': CANONICAL_FIELDS.eventStartTimestamp,
  'utc offset in seconds': CANONICAL_FIELDS.utcOffsetSeconds,
  'end reason type': CANONICAL_FIELDS.endReasonType,
  'end position in milliseconds': CANONICAL_FIELDS.endPositionMs,
  'start position in milliseconds': CANONICAL_FIELDS.startPositionMs,
  'item type': CANONICAL_FIELDS.itemType,
  'media type': CANONICAL_FIELDS.mediaType,
  'event type': CANONICAL_FIELDS.eventType,
};

export const PLAY_ACTIVITY_FILE_NAMES = [
  'apple music play activity.csv',
];

export function isPlayActivityPath(path) {
  const base = path.split(/[/\\]/).pop()?.toLowerCase() ?? '';
  return PLAY_ACTIVITY_FILE_NAMES.includes(base);
}

/**
 * @param {string[]} headers
 * @returns {{ missing: string[], present: string[] }}
 */
export function validateHeaders(headers) {
  const normalized = new Set(headers.map((h) => resolveCanonicalHeader(h) || h));
  const missing = REQUIRED_CSV_FIELDS.filter((f) => !normalized.has(f));
  const present = headers.filter(Boolean);
  const hasArtistSource =
    normalized.has(CANONICAL_FIELDS.artistName) ||
    present.some((h) => ARTIST_SOURCE_HEADERS.includes(h.trim()));
  const warnings = [];
  if (!hasArtistSource) {
    warnings.push(
      'No Artist Name or Container Artist Name column; artists will show as "Unknown Artist" unless enriched later.',
    );
  }
  return { missing, present, warnings, hasArtistSource };
}

/**
 * @param {string} header
 * @returns {string | null}
 */
export function resolveCanonicalHeader(header) {
  if (!header) {
    return null;
  }
  const trimmed = header.trim();
  if (Object.values(CANONICAL_FIELDS).includes(trimmed)) {
    return trimmed;
  }
  return FIELD_ALIASES[trimmed.toLowerCase()] ?? null;
}
