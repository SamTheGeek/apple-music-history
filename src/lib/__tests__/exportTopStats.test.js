import { describe, expect, it } from 'vitest';
import {
  MAX_EXPORT_ROWS,
  buildArtistsCsv,
  buildSongsCsv,
  buildTopStatsJson,
} from '../exportTopStats.js';

describe('exportTopStats', () => {
  const filteredSongs = [
    {
      key: "'A' by B",
      value: { name: 'A', artist: 'B', plays: 3, time: 180000, missedTime: 1000 },
    },
    {
      key: "'C' by D",
      value: { name: 'C', artist: 'D', plays: 1, time: 60000, missedTime: 0 },
    },
  ];
  const artists = [
    { key: 'B', value: { plays: 3, time: 180000 } },
    { key: 'D', value: { plays: 1, time: 60000 } },
  ];
  const totals = { totalPlays: 4, totalTime: 240000 };

  it('buildTopStatsJson includes totals, songs, artists, and exclusions', () => {
    const json = buildTopStatsJson({
      filteredSongs,
      artists,
      totals,
      thisYear: null,
      excludedSongs: ["'X' by Y"],
    });
    expect(json.totals.totalPlays).toBe(4);
    expect(json.excludedSongKeys).toEqual(["'X' by Y"]);
    expect(json.songs).toHaveLength(2);
    expect(json.songs[0].rank).toBe(1);
    expect(json.songs[0].name).toBe('A');
    expect(json.artists[0].name).toBe('B');
    expect(json.truncated.songs).toBe(false);
    expect(json.truncated.artists).toBe(false);
  });

  it('caps lists at MAX_EXPORT_ROWS', () => {
    const many = Array.from({ length: MAX_EXPORT_ROWS + 10 }, (_, i) => ({
      key: `k${i}`,
      value: { name: `n${i}`, artist: 'a', plays: 1, time: 1000, missedTime: 0 },
    }));
    const json = buildTopStatsJson({
      filteredSongs: many,
      artists: many,
      totals,
      thisYear: null,
      excludedSongs: [],
    });
    expect(json.songs).toHaveLength(MAX_EXPORT_ROWS);
    expect(json.artists).toHaveLength(MAX_EXPORT_ROWS);
    expect(json.truncated.songs).toBe(true);
    expect(json.truncated.artists).toBe(true);
  });

  it('buildSongsCsv and buildArtistsCsv include headers', () => {
    const songsCsv = buildSongsCsv(filteredSongs);
    expect(songsCsv.split('\n')[0]).toContain('rank');
    expect(songsCsv).toContain('A');
    const artistsCsv = buildArtistsCsv(artists);
    expect(artistsCsv.split('\n')[0]).toContain('rank');
    expect(artistsCsv).toContain('B');
  });
});
