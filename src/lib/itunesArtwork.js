/**
 * Fetch album artwork from the iTunes Search API (no jsonp).
 * @param {string} songName
 * @param {string} artistName
 * @returns {Promise<string | null>}
 */
export async function fetchItunesArtworkUrl(songName, artistName) {
  const term = encodeURIComponent(`${songName} ${artistName}`);
  const url = `https://itunes.apple.com/search?term=${term}&country=US&media=music&entity=musicTrack&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const artwork = data?.results?.[0]?.artworkUrl100 ?? data?.results?.[0]?.artworkUrl30;
    if (!artwork) {
      return null;
    }
    return artwork.replace(/\/\d+x\d+bb/, '/300x300bb');
  } catch {
    return null;
  }
}
