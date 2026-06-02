import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { validateHeaders, SCHEMA_VERSION, REQUIRED_FIELDS } from '../schema/playActivity.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, '../../../fixtures/play-activity/sample-rows.csv');

describe('playActivity schema', () => {
  it('exports a schema version', () => {
    expect(SCHEMA_VERSION).toMatch(/^\d{4}\.\d+$/);
  });

  it('sample fixture has all required columns', () => {
    const headerLine = readFileSync(fixturePath, 'utf8').split(/\r?\n/)[0];
    const headers = headerLine.split(',');
    const { missing } = validateHeaders(headers);
    expect(missing).toEqual([]);
    expect(REQUIRED_FIELDS.length).toBeGreaterThan(0);
  });
});
