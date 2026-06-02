import { CANONICAL_FIELDS } from './schema/playActivity.js';
import { UNKNOWN_ARTIST } from './normalizePlayRow.js';
import { searchItunesArtist } from '../lib/itunesMetadata.js';
import { artistCacheKey, loadArtistCache, saveArtistCache } from './artistCache.js';

const DEFAULT_MAX_LOOKUPS = 500;
const LOOKUP_DELAY_MS = 120;

/**
 * @param {Record<string, string>[]} rows
 * @returns {Map<string, { song: string, album: string, count: number }>}
 */
export function buildTrackFrequencyMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const song = row[CANONICAL_FIELDS.songName]?.trim();
    if (!song) {
      continue;
    }
    const artist = row[CANONICAL_FIELDS.artistName]?.trim();
    if (artist && artist !== UNKNOWN_ARTIST) {
      continue;
    }
    const album = row['Album Name']?.trim() ?? '';
    const key = artistCacheKey(song, album);
    const prev = map.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      map.set(key, { song, album, count: 1 });
    }
  }
  return map;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Resolve artists for the most-played unique unknown tracks.
 * @param {Record<string, string>[]} rows
 * @param {{
 *   maxLookups?: number,
 *   onProgress?: (p: { phase: string, done: number, total: number }) => void,
 * }} [options]
 * @returns {Promise<Record<string, string>[]>}
 */
export async function enrichArtists(rows, options = {}) {
  const maxLookups = options.maxLookups ?? DEFAULT_MAX_LOOKUPS;
  const freq = buildTrackFrequencyMap(rows);
  const candidates = [...freq.values()].sort((a, b) => b.count - a.count).slice(0, maxLookups);

  if (candidates.length === 0) {
    return rows;
  }

  const cache = typeof localStorage !== 'undefined' ? loadArtistCache() : {};
  let lookups = 0;
  let resolved = 0;

  for (let i = 0; i < candidates.length; i++) {
    const { song, album } = candidates[i];
    const key = artistCacheKey(song, album);

    options.onProgress?.({
      phase: 'enriching',
      done: i,
      total: candidates.length,
    });

    if (cache[key]) {
      continue;
    }

    try {
      const match = await searchItunesArtist(song, album);
      lookups += 1;
      if (match?.artistName) {
        cache[key] = match.artistName;
        resolved += 1;
      } else {
        cache[key] = UNKNOWN_ARTIST;
      }
      if (typeof localStorage !== 'undefined' && lookups % 25 === 0) {
        saveArtistCache(cache);
      }
      await sleep(LOOKUP_DELAY_MS);
    } catch {
      cache[key] = UNKNOWN_ARTIST;
    }
  }

  if (typeof localStorage !== 'undefined') {
    saveArtistCache(cache);
  }

  options.onProgress?.({ phase: 'enriching', done: candidates.length, total: candidates.length });

  return applyArtistCache(rows, cache);
}

/**
 * @param {Record<string, string>[]} rows
 * @param {Record<string, string>} cache
 */
export function applyArtistCache(rows, cache) {
  return rows.map((row) => {
    if (row[CANONICAL_FIELDS.artistName] !== UNKNOWN_ARTIST) {
      return row;
    }
    const song = row[CANONICAL_FIELDS.songName]?.trim();
    if (!song) {
      return row;
    }
    const key = artistCacheKey(song, row['Album Name'] ?? '');
    const artist = cache[key];
    if (artist && artist !== UNKNOWN_ARTIST) {
      return { ...row, [CANONICAL_FIELDS.artistName]: artist };
    }
    return row;
  });
}
