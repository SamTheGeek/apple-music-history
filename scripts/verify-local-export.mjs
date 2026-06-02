#!/usr/bin/env node
/**
 * Verify test-data ZIPs parse and compute stats (local only).
 * Usage: node scripts/verify-local-export.mjs [test-data-dir]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expandNestedZips } from '../src/data/loadExport.js';
import { unzipSync } from 'fflate';
import { isPlayActivityPath, validateHeaders, SCHEMA_VERSION } from '../src/data/schema/playActivity.js';
import { parsePlayActivityCsv } from '../src/data/loadExport.js';
import Computation from '../src/components/Computation.js';

const dir = process.argv[2] ?? 'test-data';

function findZips(folder) {
  const out = [];
  for (const name of readdirSync(folder)) {
    const path = join(folder, name);
    if (statSync(path).isFile() && name.toLowerCase().endsWith('.zip')) {
      out.push(path);
    }
  }
  return out.sort();
}

const zips = findZips(dir);
if (zips.length === 0) {
  console.error(`No .zip files in ${dir}`);
  process.exit(1);
}

console.log(`Schema ${SCHEMA_VERSION}`);
console.log(`ZIP parts: ${zips.length}\n`);

let merged = {};
for (const z of zips) {
  const buf = readFileSync(z);
  console.log(`Reading ${z} (${(buf.length / 1e6).toFixed(1)} MB)`);
  merged = { ...merged, ...expandNestedZips(unzipSync(new Uint8Array(buf))) };
}

const playPath = Object.keys(merged).find((p) => isPlayActivityPath(p));
if (!playPath) {
  console.error('Play Activity CSV not found after expanding nested ZIPs.');
  process.exit(1);
}

const csvText = new TextDecoder('utf-8').decode(merged[playPath]);
const headerLine = csvText.split(/\r?\n/)[0];
const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
const { missing, warnings } = validateHeaders(headers);

console.log(`\nPlay Activity: ${playPath}`);
console.log(`Columns: ${headers.length}`);
if (warnings.length) warnings.forEach((w) => console.warn(`Warning: ${w}`));
if (missing.length) {
  console.error(`Missing columns: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Parsing CSV…');
const rows = await parsePlayActivityCsv(csvText);
console.log(`Rows: ${rows.length.toLocaleString()}`);
console.log(`Sample artist: ${rows[0]?.['Artist Name']}`);

console.log('Computing stats…');
const results = await new Promise((resolve) => {
  Computation.calculateTop(rows, [], resolve);
});

console.log(`\nTop song: ${results.filteredSongs[0]?.key ?? '(none)'}`);
console.log(`Total plays: ${results.totals.totalPlays.toLocaleString()}`);
console.log(`Unique songs: ${results.songs.length.toLocaleString()}`);
console.log('\nOK — export is compatible.');
