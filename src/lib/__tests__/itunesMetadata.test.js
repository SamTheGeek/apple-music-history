import { describe, it, expect } from 'vitest';
import { scoreItunesMatch, albumSearchHint, normalizeForMatch } from '../itunesMetadata.js';

describe('itunesMetadata', () => {
  it('normalizes strings for matching', () => {
    expect(normalizeForMatch('Stargirl (feat. X)')).toBe('stargirl');
  });

  it('strips Single suffix from album hint', () => {
    expect(albumSearchHint('stargirl - Single')).toBe('stargirl');
  });

  it('scores exact song and album match highly', () => {
    const score = scoreItunesMatch('stargirl', 'stargirl - Single', {
      trackName: 'stargirl',
      collectionName: 'stargirl - Single',
      artistName: 'Charlotte Plank',
    });
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it('rejects poor track name match', () => {
    const score = scoreItunesMatch('stargirl', 'stargirl - Single', {
      trackName: 'Completely Different',
      collectionName: 'Other Album',
      artistName: 'Someone',
    });
    expect(score).toBe(0);
  });
});
