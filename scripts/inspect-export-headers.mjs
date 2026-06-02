#!/usr/bin/env node
/**
 * Inspect CSV headers from Apple privacy exports.
 * Usage: node scripts/inspect-export-headers.mjs [path-or-dir...]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import {
  REQUIRED_FIELDS,
  validateHeaders,
  resolveCanonicalHeader,
  SCHEMA_VERSION,
  isPlayActivityPath,
} from '../src/data/schema/playActivity.js';

function collectCsvFiles(target) {
  const files = [];
  const st = statSync(target);
  if (st.isFile() && extname(target).toLowerCase() === '.csv') {
    files.push(target);
    return files;
  }
  if (st.isDirectory()) {
    for (const name of readdirSync(target)) {
      files.push(...collectCsvFiles(join(target, name)));
    }
  }
  return files;
}

function readHeaders(filePath) {
  const chunk = readFileSync(filePath, 'utf8').slice(0, 8192);
  const line = chunk.split(/\r?\n/)[0] ?? '';
  return line.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node scripts/inspect-export-headers.mjs <file-or-directory> [...]');
  process.exit(1);
}

console.log(`Schema version: ${SCHEMA_VERSION}\n`);

let exitCode = 0;

for (const target of targets) {
  let files;
  try {
    files = collectCsvFiles(target);
  } catch (err) {
    console.error(`Cannot read ${target}: ${err.message}`);
    exitCode = 1;
    continue;
  }

  if (files.length === 0) {
    console.warn(`No CSV files under ${target}`);
    continue;
  }

  for (const file of files) {
    const headers = readHeaders(file);
    const { missing, present } = validateHeaders(headers);
    const playActivity = isPlayActivityPath(file);

    console.log(`--- ${file}${playActivity ? ' [Play Activity]' : ''} ---`);
    console.log(`Columns (${present.length}): ${present.join(' | ')}`);

    if (missing.length > 0) {
      console.log(`Missing required: ${missing.join(', ')}`);
      if (playActivity) {
        exitCode = 1;
      }
    } else if (playActivity) {
      console.log('All required Play Activity columns present.');
    }

    const unknown = headers.filter((h) => !resolveCanonicalHeader(h) && !REQUIRED_FIELDS.includes(h));
    if (unknown.length > 0) {
      console.log(`Extra columns (not in alias map): ${unknown.slice(0, 10).join(', ')}${unknown.length > 10 ? '…' : ''}`);
    }
    console.log('');
  }
}

process.exit(exitCode);
