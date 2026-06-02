import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { zipSync, unzipSync } from 'fflate';
import {
  parsePlayActivityCsv,
  expandNestedZips,
  parseZipEntries,
  scoreAppleMusicActivityPath,
} from '../loadExport.js';
import { isPlayActivityPath } from '../schema/playActivity.js';
import { isDailyTracksPath } from '../schema/playHistoryDailyTracks.js';
import { parseDailyTracksCsv } from '../parseDailyTracksCsv.js';
import Computation from '../../components/Computation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, '../../../fixtures/play-activity/sample-rows.csv');
const dailyFixturePath = join(__dirname, '../../../fixtures/play-activity/daily-tracks-sample.csv');

describe('loadExport helpers', () => {
  it('prefers canonical Apple_Media_Services activity path score', () => {
    const a = scoreAppleMusicActivityPath('Apple_Media_Services/Apple Music Activity/Apple Music Play Activity.csv');
    const b = scoreAppleMusicActivityPath('tmp/Apple Music Play Activity.csv');
    expect(a).toBeGreaterThan(b);
  });

  it('parses sample daily tracks fixture', async () => {
    const text = readFileSync(dailyFixturePath, 'utf8');
    const rows = await parseDailyTracksCsv(text);
    expect(rows.length).toBe(3);
    expect(rows[0]['Artist Name']).toBe('Test Artist');
    expect(rows[0]['Song Name']).toBe('Test Song Alpha');
  });

  it('parseZipEntries loads play activity and daily tracks from nested zip', async () => {
    const playCsv = readFileSync(fixturePath, 'utf8');
    const dailyCsv = readFileSync(dailyFixturePath, 'utf8');
    const inner = zipSync({
      'Apple_Media_Services/Apple Music Activity/Apple Music Play Activity.csv': new TextEncoder().encode(
        playCsv,
      ),
      'Apple_Media_Services/Apple Music Activity/Apple Music - Play History Daily Tracks.csv':
        new TextEncoder().encode(dailyCsv),
    });
    const outer = zipSync({
      'Apple_Media_Services.zip': inner,
    });
    const merged = expandNestedZips(unzipSync(outer));
    const { playActivityRows, dailyTrackRows, sourcePaths } = await parseZipEntries(merged);
    expect(playActivityRows.length).toBe(3);
    expect(dailyTrackRows?.length).toBe(3);
    expect(sourcePaths.dailyTracks).toContain('Play History Daily Tracks');
  });
  it('uses daily tracks for headline totals when provided', async () => {
    const playRows = await parsePlayActivityCsv(readFileSync(fixturePath, 'utf8'));
    const dailyRows = await parseDailyTracksCsv(readFileSync(dailyFixturePath, 'utf8'));
    const merged = await new Promise((resolve) => {
      Computation.calculateTop(playRows, [], resolve, { dailyTrackRows: dailyRows });
    });
    expect(merged.totals.totalPlays).toBe(4);
  });

  it('recognizes daily tracks file paths', () => {
    expect(isDailyTracksPath('Apple Music Activity/Apple Music - Play History Daily Tracks.csv')).toBe(true);
    expect(isDailyTracksPath('Apple Music Play Activity.csv')).toBe(false);
  });

  it('recognizes play activity file paths', () => {
    expect(isPlayActivityPath('Apple Music Activity/Apple Music Play Activity.csv')).toBe(true);
    expect(isPlayActivityPath('other.csv')).toBe(false);
  });

  it('parses sample CSV fixture', async () => {
    const text = readFileSync(fixturePath, 'utf8');
    const rows = await parsePlayActivityCsv(text);
    expect(rows.length).toBe(3);
    expect(rows[0]['Song Name']).toBe('Test Song Alpha');
  });

  it('finds play activity inside nested zip layout', () => {
    const csv = readFileSync(fixturePath, 'utf8');
    const inner = zipSync({
      'Apple_Media_Services/Apple Music Activity/Apple Music Play Activity.csv':
        new TextEncoder().encode(csv),
    });
    const outer = zipSync({
      'Apple_Media_Services.zip': inner,
    });
    const expanded = expandNestedZips(unzipSync(outer));
    const path = Object.keys(expanded).find((p) => isPlayActivityPath(p));
    expect(path).toBeTruthy();
  });
});
