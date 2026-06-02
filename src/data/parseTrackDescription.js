/**
 * Parse Apple's combined "Track Description" from Play History Daily Tracks.
 * Common shapes: "Artist - Title", "Artist - Album - Title", or plain "Title".
 * @param {string} raw
 * @returns {{ artist: string, song: string, album: string }}
 */
export function parseTrackDescription(raw) {
  const s = raw?.trim() ?? '';
  if (!s) {
    return { artist: 'Unknown Artist', song: '', album: '' };
  }
  const parts = s.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    return { artist: 'Unknown Artist', song: parts[0], album: '' };
  }
  if (parts.length === 2) {
    return { artist: parts[0], song: parts[1], album: '' };
  }
  const artist = parts[0];
  const song = parts[parts.length - 1];
  const album = parts.slice(1, -1).join(' - ');
  return { artist, song, album };
}
