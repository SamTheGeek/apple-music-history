import Papa from 'papaparse';
import { unzipSync } from 'fflate';
import { isPlayActivityPath } from './schema/playActivity.js';
import { isDailyTracksPath } from './schema/playHistoryDailyTracks.js';
import { normalizePlayRows } from './normalizePlayRow.js';
import { validatePlayActivityHeaders, validatePlayActivityRows } from './validateExport.js';
import {
  parseDailyTracksCsv,
  validateDailyTracksRowsFromHeaders,
  validateDailyTracksRows,
} from './parseDailyTracksCsv.js';

/**
 * @param {ArrayBuffer} buffer
 * @returns {Record<string, Uint8Array>}
 */
function unzipToEntries(buffer) {
  const bytes = new Uint8Array(buffer);
  return unzipSync(bytes);
}

const MAX_NESTED_ZIP_DEPTH = 5;

/**
 * Apple privacy exports often wrap Apple_Media_Services.zip inside the top-level ZIP.
 * @param {Record<string, Uint8Array>} entries
 * @param {number} [depth]
 * @returns {Record<string, Uint8Array>}
 */
export function expandNestedZips(entries, depth = 0) {
  if (depth >= MAX_NESTED_ZIP_DEPTH) {
    return entries;
  }

  const result = { ...entries };
  let expanded = false;

  for (const [path, data] of Object.entries(entries)) {
    if (!path.toLowerCase().endsWith('.zip') || path.endsWith('/')) {
      continue;
    }
    delete result[path];
    try {
      const nested = unzipSync(data);
      Object.assign(result, nested);
      expanded = true;
    } catch {
      // not a zip or corrupt — ignore
    }
  }

  return expanded ? expandNestedZips(result, depth + 1) : result;
}

/**
 * Prefer canonical Apple_Media_Services → Apple Music Activity paths when multiple CSVs exist.
 * @param {string} p
 * @returns {number}
 */
export function scoreAppleMusicActivityPath(p) {
  const lower = p.replace(/\\/g, '/').toLowerCase();
  if (lower.includes('apple_media_services') && lower.includes('apple music activity')) {
    return 2;
  }
  if (lower.includes('apple music activity')) {
    return 1;
  }
  return 0;
}

/**
 * @param {Record<string, Uint8Array>} entries
 * @returns {string[]}
 */
export function findAllPlayActivityPaths(entries) {
  const paths = Object.keys(entries).filter((p) => isPlayActivityPath(p) && !p.endsWith('/'));
  return paths.sort((a, b) => scoreAppleMusicActivityPath(b) - scoreAppleMusicActivityPath(a));
}

/**
 * @param {Record<string, Uint8Array>} entries
 * @returns {{ path: string, data: Uint8Array } | null}
 */
export function findDailyTracksInZip(entries) {
  const paths = Object.keys(entries).filter((p) => isDailyTracksPath(p) && !p.endsWith('/'));
  if (paths.length === 0) {
    return null;
  }
  paths.sort((a, b) => scoreAppleMusicActivityPath(b) - scoreAppleMusicActivityPath(a));
  const path = paths[0];
  return { path, data: entries[path] };
}

/**
 * @param {Record<string, Uint8Array>} entries
 * @returns {{ path: string, data: Uint8Array } | null}
 */
function findFirstPlayActivityInZip(entries) {
  const paths = findAllPlayActivityPaths(entries);
  if (paths.length === 0) {
    return null;
  }
  return { path: paths[0], data: entries[paths[0]] };
}

/**
 * @param {ArrayBuffer} buffer
 * @returns {Record<string, Uint8Array>}
 */
function unzipAndExpand(buffer) {
  return expandNestedZips(unzipToEntries(buffer));
}

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
function decodeUtf8(data) {
  return new TextDecoder('utf-8').decode(data);
}

/**
 * @param {string} csvText
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<Record<string, string>[]>}
 */
export function parsePlayActivityCsv(csvText, onProgress) {
  onProgress?.({ phase: 'parsing', percent: 0 });

  return new Promise((resolve, reject) => {
    const rows = [];
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      step(results) {
        if (results.data) {
          rows.push(results.data);
        }
      },
      complete() {
        onProgress?.({ phase: 'parsing', percent: 100 });
        resolve(normalizePlayRows(rows));
      },
      error(err) {
        reject(new Error(err.message || 'Failed to parse CSV'));
      },
    });
  });
}

/**
 * @param {Record<string, Uint8Array>} entries
 * @param {string[]} paths
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<Record<string, string>[]>}
 */
async function parseMergedPlayActivityFromZip(entries, paths, onProgress) {
  let merged = [];
  for (let i = 0; i < paths.length; i++) {
    const csvText = decodeUtf8(entries[paths[i]]);
    const rows = await parsePlayActivityCsv(csvText, onProgress);
    merged = merged.concat(rows);
  }
  return merged;
}

/**
 * @param {Record<string, Uint8Array>} entries
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<{ playActivityRows: Record<string, string>[], dailyTrackRows: Record<string, string>[] | null, sourcePaths: { playActivity: string, dailyTracks: string | null } }>}
 */
export async function parseZipEntries(entries, onProgress) {
  const paths = findAllPlayActivityPaths(entries);
  if (paths.length === 0) {
    throw new Error(
      'No "Apple Music Play Activity.csv" found. Upload that file directly, or include the full Apple Media Services ZIP.',
    );
  }

  const firstCsv = decodeUtf8(entries[paths[0]]);
  const headerLine = firstCsv.split(/\r?\n/)[0] ?? '';
  const headers = Papa.parse(headerLine, { header: false }).data[0] ?? [];
  const headerValidation = validatePlayActivityHeaders(headers);
  if (!headerValidation.ok) {
    throw new Error(headerValidation.message);
  }

  const playActivityRows = await parseMergedPlayActivityFromZip(entries, paths, onProgress);
  const rowValidation = validatePlayActivityRows(playActivityRows);
  if (!rowValidation.ok) {
    throw new Error(rowValidation.message);
  }

  let dailyTrackRows = null;
  let dailyPath = null;
  const dailyFound = findDailyTracksInZip(entries);
  if (dailyFound) {
    const dailyText = decodeUtf8(dailyFound.data);
    const dailyHeaderLine = dailyText.split(/\r?\n/)[0] ?? '';
    const dailyHeaders = Papa.parse(dailyHeaderLine, { header: false }).data[0] ?? [];
    const dailyHeaderVal = validateDailyTracksRowsFromHeaders(
      dailyHeaders.map((h) => String(h ?? '').trim()),
    );
    if (dailyHeaderVal.ok) {
      dailyTrackRows = await parseDailyTracksCsv(dailyText, onProgress);
      const dailyRowVal = validateDailyTracksRows(dailyTrackRows);
      if (!dailyRowVal.ok) {
        dailyTrackRows = null;
      } else {
        dailyPath = dailyFound.path;
      }
    }
  }

  return {
    playActivityRows,
    dailyTrackRows,
    sourcePaths: {
      playActivity: paths.join(' | '),
      dailyTracks: dailyPath,
    },
  };
}

/**
 * @param {File} file
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<{ playActivityRows: Record<string, string>[], dailyTrackRows: Record<string, string>[] | null, sourcePaths: { playActivity: string, dailyTracks: string | null } }>}
 */
async function loadCsvFile(file, onProgress) {
  onProgress?.({ phase: 'reading', percent: 0 });
  const text = await file.text();
  onProgress?.({ phase: 'reading', percent: 100 });

  const headerLine = text.split(/\r?\n/)[0] ?? '';
  const headers = Papa.parse(headerLine, { header: false }).data[0] ?? [];
  const headerValidation = validatePlayActivityHeaders(headers);
  if (!headerValidation.ok) {
    throw new Error(headerValidation.message);
  }

  const playActivityRows = await parsePlayActivityCsv(text, onProgress);
  const rowValidation = validatePlayActivityRows(playActivityRows);
  if (!rowValidation.ok) {
    throw new Error(rowValidation.message);
  }

  return {
    playActivityRows,
    dailyTrackRows: null,
    sourcePaths: { playActivity: file.name, dailyTracks: null },
  };
}

/**
 * @param {File} file
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<{ playActivityRows: Record<string, string>[], dailyTrackRows: Record<string, string>[] | null, sourcePaths: { playActivity: string, dailyTracks: string | null } }>}
 */
async function loadZipFile(file, onProgress) {
  onProgress?.({ phase: 'unzipping', percent: 0 });
  const buffer = await file.arrayBuffer();
  let entries;
  try {
    entries = unzipAndExpand(buffer);
  } catch {
    throw new Error(`Could not unzip "${file.name}". Try uploading the CSV directly.`);
  }
  onProgress?.({ phase: 'unzipping', percent: 100 });

  const result = await parseZipEntries(entries, onProgress);
  return result;
}

/**
 * Load one or more ZIP parts / CSV files.
 * @param {File | File[]} input
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<{ playActivityRows: Record<string, string>[], dailyTrackRows: Record<string, string>[] | null, sourcePaths: { playActivity: string, dailyTracks: string | null } }>}
 */
export async function loadExport(input, onProgress) {
  const files = Array.isArray(input) ? input : [input];
  if (files.length === 0) {
    throw new Error('No file selected.');
  }

  const csvFiles = files.filter((f) => f.name.toLowerCase().endsWith('.csv'));
  const zipFiles = files.filter((f) => f.name.toLowerCase().endsWith('.zip'));

  if (csvFiles.length === 1 && zipFiles.length === 0) {
    return loadCsvFile(csvFiles[0], onProgress);
  }

  if (csvFiles.length > 1) {
    throw new Error('Please upload a single CSV or one or more ZIP parts, not multiple CSVs.');
  }

  if (zipFiles.length === 0) {
    const f = files[0];
    if (f.name.toLowerCase().endsWith('.csv')) {
      return loadCsvFile(f, onProgress);
    }
    throw new Error('Unsupported file type. Upload .csv or .zip from your Apple export.');
  }

  /** Merge entries from multiple ZIP parts (same export split by Apple) */
  if (zipFiles.length > 1) {
    onProgress?.({ phase: 'unzipping', percent: 0 });
    const merged = {};
    for (let i = 0; i < zipFiles.length; i++) {
      const buffer = await zipFiles[i].arrayBuffer();
      const entries = unzipAndExpand(buffer);
      Object.assign(merged, entries);
      onProgress?.({ phase: 'unzipping', percent: Math.round(((i + 1) / zipFiles.length) * 100) });
    }
    return parseZipEntries(merged, onProgress);
  }

  return loadZipFile(zipFiles[0], onProgress);
}

/**
 * Filter rows by optional start date (YYYY-MM-DD).
 * @param {Record<string, string>[]} rows
 * @param {string} filterDate
 * @returns {Record<string, string>[]}
 */
export function filterRowsByStartDate(rows, filterDate) {
  if (!filterDate || filterDate.length < 2) {
    return rows;
  }
  const cutoff = `${filterDate}T00:00:00`;
  return rows.filter(
    (row) =>
      (row['Event End Timestamp'] && row['Event End Timestamp'] >= cutoff) ||
      (row['Event Start Timestamp'] && row['Event Start Timestamp'] >= cutoff),
  );
}

export { filterDailyTracksByStartDate } from './parseDailyTracksCsv.js';
