import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { zipSync, unzipSync } from 'fflate';
import { parsePlayActivityCsv, expandNestedZips } from '../loadExport.js';
import { isPlayActivityPath } from '../schema/playActivity.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, '../../../fixtures/play-activity/sample-rows.csv');

describe('loadExport helpers', () => {
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
