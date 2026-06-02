import { describe, it, expect } from 'vitest';
import { parseTrackDescription } from '../parseTrackDescription.js';

describe('parseTrackDescription', () => {
  it('parses artist and title for two segments', () => {
    const r = parseTrackDescription('CHVRCHES - The Mother We Share');
    expect(r.artist).toBe('CHVRCHES');
    expect(r.song).toBe('The Mother We Share');
    expect(r.album).toBe('');
  });

  it('parses three-part as artist, album, title', () => {
    const r = parseTrackDescription('Artist Name - Album Title - Song Title');
    expect(r.artist).toBe('Artist Name');
    expect(r.album).toBe('Album Title');
    expect(r.song).toBe('Song Title');
  });

  it('uses unknown artist for single segment', () => {
    const r = parseTrackDescription('Instrumental');
    expect(r.artist).toBe('Unknown Artist');
    expect(r.song).toBe('Instrumental');
  });
});
