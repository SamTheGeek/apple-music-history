import { albumSearchHint } from '../lib/itunesMetadata.js';

const CACHE_KEY = 'apple-music-history-artist-cache-v1';
const MAX_ENTRIES = 8000;

/**
 * @returns {Record<string, string>}
 */
export function loadArtistCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, string>} cache
 */
export function saveArtistCache(cache) {
  const keys = Object.keys(cache);
  if (keys.length > MAX_ENTRIES) {
    const trimmed = {};
    for (const k of keys.slice(-MAX_ENTRIES)) {
      trimmed[k] = cache[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    return;
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * @param {string} songName
 * @param {string} albumName
 */
export function artistCacheKey(songName, albumName = '') {
  return `${songName.trim().toLowerCase()}|${albumSearchHint(albumName).toLowerCase()}`;
}
