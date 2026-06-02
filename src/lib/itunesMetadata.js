/**
 * iTunes Search API helpers for track metadata (artist, artwork).
 */

/**
 * @param {string} s
 */
export function normalizeForMatch(s) {
  return (s ?? '')
    .toLowerCase()
    .replace(/\(feat\..*?\)/gi, '')
    .replace(/\(with.*?\)/gi, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/**
 * @param {string} albumName
 */
export function albumSearchHint(albumName) {
  if (!albumName) {
    return '';
  }
  return albumName
    .replace(/\s*-\s*(Single|EP|DJ Mix|Deluxe Edition.*)$/i, '')
    .replace(/\s*\(DJ Mix\)$/i, '')
    .trim();
}

/**
 * @param {string} songName
 * @param {string} albumName
 * @param {{ trackName: string, collectionName?: string, artistName: string }} result
 */
export function scoreItunesMatch(songName, albumName, result) {
  const sn = normalizeForMatch(songName);
  const tn = normalizeForMatch(result.trackName);
  let score = 0;
  if (!sn || !tn) {
    return 0;
  }
  if (tn === sn) {
    score += 100;
  } else if (tn.includes(sn) || sn.includes(tn)) {
    score += 60;
  } else {
    return 0;
  }
  const hint = albumSearchHint(albumName);
  if (hint && result.collectionName) {
    const ah = normalizeForMatch(hint);
    const cn = normalizeForMatch(result.collectionName);
    if (ah && cn && (cn.includes(ah) || ah.includes(cn))) {
      score += 40;
    }
  }
  return score;
}

/**
 * @param {string} songName
 * @param {string} [albumName]
 * @returns {Promise<{ artistName: string, trackName: string } | null>}
 */
export async function searchItunesArtist(songName, albumName = '') {
  const hint = albumSearchHint(albumName);
  const term = encodeURIComponent([songName, hint].filter(Boolean).join(' '));
  const url = `https://itunes.apple.com/search?term=${term}&country=US&media=music&entity=song&limit=8`;

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  const results = data?.results ?? [];
  if (results.length === 0) {
    return null;
  }

  let best = null;
  let bestScore = 0;
  for (const result of results) {
    if (!result.artistName || !result.trackName) {
      continue;
    }
    const score = scoreItunesMatch(songName, albumName, result);
    if (score > bestScore) {
      bestScore = score;
      best = { artistName: result.artistName, trackName: result.trackName };
    }
  }
  return bestScore >= 60 ? best : null;
}
