import { describe, it, expect } from 'vitest';
import { normalizePlayRow } from '../normalizePlayRow.js';
import { CANONICAL_FIELDS } from '../schema/playActivity.js';

describe('normalizePlayRow', () => {
  it('passes through canonical column names', () => {
    const row = {
      [CANONICAL_FIELDS.songName]: 'Song',
      [CANONICAL_FIELDS.artistName]: 'Artist',
    };
    const out = normalizePlayRow(row);
    expect(out[CANONICAL_FIELDS.songName]).toBe('Song');
  });

  it('maps lowercase alias headers', () => {
    const row = { 'song name': 'Alias Song', 'artist name': 'Alias Artist' };
    const out = normalizePlayRow(row);
    expect(out[CANONICAL_FIELDS.songName]).toBe('Alias Song');
    expect(out[CANONICAL_FIELDS.artistName]).toBe('Alias Artist');
  });

  it('uses Container Artist Name when Artist Name is absent (2026 export)', () => {
    const row = {
      'Song Name': 'Track',
      'Container Artist Name': 'CHVRCHES',
    };
    const out = normalizePlayRow(row);
    expect(out[CANONICAL_FIELDS.artistName]).toBe('CHVRCHES');
  });

  it('falls back to Unknown Artist', () => {
    const row = { 'Song Name': 'Track' };
    const out = normalizePlayRow(row);
    expect(out[CANONICAL_FIELDS.artistName]).toBe('Unknown Artist');
  });
});
