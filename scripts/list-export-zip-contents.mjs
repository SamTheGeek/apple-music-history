#!/usr/bin/env node
/**
 * List all paths inside Apple Media Services ZIPs after nested expansion (same as the app).
 * Optionally print CSV header lines and row counts.
 *
 * Usage:
 *   node scripts/list-export-zip-contents.mjs [dir-with-zips]
 *   node scripts/list-export-zip-contents.mjs --count [dir]
 *
 * Default dir: test-data (ZIPs directly in folder; not recursive subdirs).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { expandNestedZips } from '../src/data/loadExport.js';
import { isPlayActivityPath } from '../src/data/schema/playActivity.js';
import { isDailyTracksPath } from '../src/data/schema/playHistoryDailyTracks.js';

const args = process.argv.slice(2);
const wantCount = args.includes('--count');
const dirs = args.filter((a) => a !== '--count');
const dir = dirs[0] ?? 'test-data';

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

function countCsvRows(data) {
  const text = new TextDecoder('utf-8').decode(data);
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  return Math.max(0, lines.length - 1);
}

const zips = findZips(dir);
if (zips.length === 0) {
  console.error(`No .zip files in ${dir}`);
  process.exit(1);
}

let merged = {};
for (const z of zips) {
  const buf = readFileSync(z);
  merged = { ...merged, ...expandNestedZips(unzipSync(new Uint8Array(buf))) };
}

const paths = Object.keys(merged).sort();
console.log(`ZIP parts: ${zips.length}`);
console.log(`Expanded entries: ${paths.length}\n`);

for (const p of paths) {
  if (p.endsWith('/')) {
    console.log(`[dir] ${p}`);
    continue;
  }
  const data = merged[p];
  const size = data?.length ?? 0;
  const flags = [];
  if (isPlayActivityPath(p)) flags.push('PLAY_ACTIVITY');
  if (isDailyTracksPath(p)) flags.push('DAILY_TRACKS');
  const tag = flags.length ? ` [${flags.join(', ')}]` : '';

  if (p.toLowerCase().endsWith('.csv')) {
    const peek = new TextDecoder('utf-8').decode(data.slice(0, 4096));
    const header = peek.split(/\r?\n/)[0] ?? '';
    let line = `${size.toLocaleString()} bytes${tag}\n  ${p}\n  header: ${header.slice(0, 200)}${header.length > 200 ? '…' : ''}`;
    if (wantCount) {
      line += `\n  rows (excl. header): ${countCsvRows(data).toLocaleString()}`;
    }
    console.log(line);
  } else {
    console.log(`${size.toLocaleString()} bytes${tag}\n  ${p}`);
  }
  console.log('');
}
