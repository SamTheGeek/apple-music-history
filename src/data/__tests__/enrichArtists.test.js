import { describe, it, expect } from 'vitest';
import { buildTrackFrequencyMap, applyArtistCache } from '../enrichArtists.js';
import { UNKNOWN_ARTIST } from '../normalizePlayRow.js';

describe('enrichArtists', () => {
  it('ranks unknown tracks by play count', () => {
    const rows = [
      { 'Song Name': 'A', 'Artist Name': UNKNOWN_ARTIST, 'Album Name': '' },
      { 'Song Name': 'A', 'Artist Name': UNKNOWN_ARTIST, 'Album Name': '' },
      { 'Song Name': 'B', 'Artist Name': UNKNOWN_ARTIST, 'Album Name': '' },
    ];
    const map = buildTrackFrequencyMap(rows);
    expect(map.get('a|')?.count).toBe(2);
    expect(map.get('b|')?.count).toBe(1);
  });

  it('applies cache to rows', () => {
    const rows = [
      { 'Song Name': 'stargirl', 'Artist Name': UNKNOWN_ARTIST, 'Album Name': 'stargirl - Single' },
    ];
    const cache = { 'stargirl|stargirl': 'Charlotte Plank' };
    const out = applyArtistCache(rows, cache);
    expect(out[0]['Artist Name']).toBe('Charlotte Plank');
  });

  it('does not overwrite known artists', () => {
    const rows = [{ 'Song Name': 'X', 'Artist Name': 'Real Artist', 'Album Name': '' }];
    const out = applyArtistCache(rows, { 'x|': 'Wrong' });
    expect(out[0]['Artist Name']).toBe('Real Artist');
  });
});
