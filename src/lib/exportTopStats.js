import Papa from 'papaparse';
import Computation from '../components/Computation.js';

/** Max rows per songs/artists table in CSV and JSON lists (avoids huge downloads). */
export const MAX_EXPORT_ROWS = 500;

/**
 * @param {object} params
 * @param {Array<{ key: string, value: { name?: string, artist?: string, plays: number, time: number, missedTime?: number } }>} params.filteredSongs
 * @param {Array<{ key: string, value: { plays: number, time: number } }>} params.artists
 * @param {{ totalPlays: number, totalTime: number }} params.totals
 * @param {object | null} [params.thisYear]
 * @param {string[]} params.excludedSongs
 * @param {number} [params.maxRows]
 */
export function buildTopStatsJson({
  filteredSongs,
  artists,
  totals,
  thisYear = null,
  excludedSongs,
  maxRows = MAX_EXPORT_ROWS,
}) {
  const cap = (arr) => arr.slice(0, maxRows);

  const songsOut = cap(filteredSongs).map((row, i) => ({
    rank: i + 1,
    key: row.key,
    name: row.value?.name ?? '',
    artist: row.value?.artist ?? '',
    plays: row.value?.plays ?? 0,
    listenedTimeMs: row.value?.time ?? 0,
    skippedTimeMs: row.value?.missedTime ?? 0,
    listenedTimeHuman: Computation.convertTime(row.value?.time ?? 0),
  }));

  const artistsOut = cap(artists).map((row, i) => ({
    rank: i + 1,
    name: row.key,
    plays: row.value?.plays ?? 0,
    listenedTimeMs: row.value?.time ?? 0,
    listenedTimeHuman: Computation.convertTime(row.value?.time ?? 0),
  }));

  let thisYearOut = null;
  if (thisYear && thisYear.totalPlays > 0) {
    const ys = Array.isArray(thisYear.songs) ? thisYear.songs : [];
    const ya = Array.isArray(thisYear.artists) ? thisYear.artists : [];
    thisYearOut = {
      year: thisYear.year,
      totalPlays: thisYear.totalPlays,
      totalTimeMs: thisYear.totalTime,
      totalTimeHuman: Computation.convertTime(Number(thisYear.totalTime) || 0),
      topSongs: cap(ys).map((row, i) => ({
        rank: i + 1,
        key: row.key,
        name: row.value?.name ?? '',
        artist: row.value?.artist ?? '',
        plays: row.value?.plays ?? 0,
        listenedTimeMs: row.value?.time ?? 0,
        listenedTimeHuman: Computation.convertTime(row.value?.time ?? 0),
      })),
      topArtists: cap(ya).map((row, i) => ({
        rank: i + 1,
        name: row.key,
        plays: row.value?.plays ?? 0,
        listenedTimeMs: row.value?.time ?? 0,
        listenedTimeHuman: Computation.convertTime(row.value?.time ?? 0),
      })),
    };
  }

  return {
    exportedAt: new Date().toISOString(),
    generator: 'Apple Music Analyser',
    excludedSongKeys: [...excludedSongs],
    totals: {
      totalPlays: totals.totalPlays,
      totalTimeMs: totals.totalTime,
      totalTimeHuman: Computation.convertTime(totals.totalTime),
    },
    songs: songsOut,
    artists: artistsOut,
    thisYear: thisYearOut,
    truncated: {
      songs: filteredSongs.length > maxRows,
      artists: artists.length > maxRows,
      maxRows,
    },
  };
}

export function buildSongsCsv(filteredSongs, maxRows = MAX_EXPORT_ROWS) {
  const rows = filteredSongs.slice(0, maxRows).map((row, i) => ({
    rank: i + 1,
    songKey: row.key,
    songName: row.value?.name ?? '',
    artistName: row.value?.artist ?? '',
    plays: row.value?.plays ?? 0,
    listenedTimeMs: row.value?.time ?? 0,
    skippedTimeMs: row.value?.missedTime ?? 0,
    listenedTimeHuman: Computation.convertTime(row.value?.time ?? 0),
  }));
  return Papa.unparse(rows, { header: true });
}

export function buildArtistsCsv(artists, maxRows = MAX_EXPORT_ROWS) {
  const rows = artists.slice(0, maxRows).map((row, i) => ({
    rank: i + 1,
    artistName: row.key,
    plays: row.value?.plays ?? 0,
    listenedTimeMs: row.value?.time ?? 0,
    listenedTimeHuman: Computation.convertTime(row.value?.time ?? 0),
  }));
  return Papa.unparse(rows, { header: true });
}

/**
 * @param {string} filename
 * @param {string} content
 * @param {string} mimeType
 */
export function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
