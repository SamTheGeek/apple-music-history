import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';
import Computation from '../../components/Computation.js';
import { normalizePlayRows } from '../normalizePlayRow.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, '../../../fixtures/play-activity/sample-rows.csv');

function loadFixture() {
  const csv = readFileSync(fixturePath, 'utf8');
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return normalizePlayRows(parsed.data);
}

describe('Computation.calculateTop golden', () => {
  it('ranks Test Song Alpha as top by play time', async () => {
    const rows = loadFixture();
    const results = await new Promise((resolve) => {
      Computation.calculateTop(rows, [], resolve);
    });

    expect(results.filteredSongs.length).toBeGreaterThan(0);
    expect(results.filteredSongs[0].value.name).toBe('Test Song Alpha');
    expect(results.filteredSongs[0].value.plays).toBe(2);
    expect(results.totals.totalPlays).toBe(3);
  });
});
