#!/usr/bin/env node
/**
 * Verify test-data ZIPs parse and compute stats (local only).
 * Usage: node scripts/verify-local-export.mjs [test-data-dir]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expandNestedZips, parseZipEntries } from '../src/data/loadExport.js';
import { unzipSync } from 'fflate';
import { SCHEMA_VERSION } from '../src/data/schema/playActivity.js';
import { DAILY_TRACKS_SCHEMA_VERSION } from '../src/data/schema/playHistoryDailyTracks.js';
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

console.log(`Play Activity schema ${SCHEMA_VERSION}`);
console.log(`Daily Tracks schema ${DAILY_TRACKS_SCHEMA_VERSION}`);
console.log(`ZIP parts: ${zips.length}\n`);

let merged = {};
for (const z of zips) {
  const buf = readFileSync(z);
  console.log(`Reading ${z} (${(buf.length / 1e6).toFixed(1)} MB)`);
  merged = { ...merged, ...expandNestedZips(unzipSync(new Uint8Array(buf))) };
}

let playActivityRows;
let dailyTrackRows;
let sourcePaths;
try {
  ({ playActivityRows, dailyTrackRows, sourcePaths } = await parseZipEntries(merged));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

console.log(`\nPlay Activity: ${sourcePaths.playActivity}`);
console.log(`Play Activity rows: ${playActivityRows.length.toLocaleString()}`);
if (sourcePaths.dailyTracks) {
  console.log(`Daily Tracks: ${sourcePaths.dailyTracks}`);
  console.log(`Daily Tracks rows: ${(dailyTrackRows?.length ?? 0).toLocaleString()}`);
} else {
  console.log('Daily Tracks: (not present or invalid in export)');
}

const activityOnly = await new Promise((resolve) => {
  Computation.calculateTop(playActivityRows, [], resolve, { dailyTrackRows: null });
});

const mergedStats = await new Promise((resolve) => {
  Computation.calculateTop(playActivityRows, [], resolve, { dailyTrackRows });
});

console.log('\n--- Compare (Play Activity only vs merged with Daily Tracks) ---');
console.log(
  `Total plays (activity semantics): ${activityOnly.totals.totalPlays.toLocaleString()} | merged UI totals: ${mergedStats.totals.totalPlays.toLocaleString()}`,
);
console.log(
  `Total time ms (activity): ${activityOnly.totals.totalTime.toLocaleString()} | merged: ${mergedStats.totals.totalTime.toLocaleString()}`,
);
console.log(`Top song (merged): ${mergedStats.filteredSongs[0]?.key ?? '(none)'}`);
console.log(`Unique songs (merged): ${mergedStats.songs.length.toLocaleString()}`);
console.log('\nOK — export is compatible.');
