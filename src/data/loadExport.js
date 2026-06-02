import Papa from 'papaparse';
import { unzipSync } from 'fflate';
import { isPlayActivityPath } from './schema/playActivity.js';
import { normalizePlayRows } from './normalizePlayRow.js';
import { validatePlayActivityHeaders, validatePlayActivityRows } from './validateExport.js';

/**
 * @param {ArrayBuffer} buffer
 * @returns {Map<string, Uint8Array>}
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
 * @param {ArrayBuffer} buffer
 * @returns {Record<string, Uint8Array>}
 */
function unzipAndExpand(buffer) {
  return expandNestedZips(unzipToEntries(buffer));
}

/**
 * @param {Map<string, Uint8Array> | Record<string, Uint8Array>} entries
 * @returns {{ path: string, data: Uint8Array } | null}
 */
function findPlayActivityInZip(entries) {
  const paths = Object.keys(entries);
  const match = paths.find((p) => isPlayActivityPath(p) && !p.endsWith('/'));
  if (!match) {
    return null;
  }
  return { path: match, data: entries[match] };
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
 * @param {File} file
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<{ rows: Record<string, string>[], sourcePath: string }>}
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

  const rows = await parsePlayActivityCsv(text, onProgress);
  const rowValidation = validatePlayActivityRows(rows);
  if (!rowValidation.ok) {
    throw new Error(rowValidation.message);
  }

  return { rows, sourcePath: file.name };
}

/**
 * @param {File} file
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<{ rows: Record<string, string>[], sourcePath: string }>}
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

  const found = findPlayActivityInZip(entries);
  if (!found) {
    throw new Error(
      `No "Apple Music Play Activity.csv" found inside "${file.name}". ` +
        'Upload that file directly, or include the full Apple Media Services ZIP.',
    );
  }

  const csvText = decodeUtf8(found.data);
  const headerLine = csvText.split(/\r?\n/)[0] ?? '';
  const headers = Papa.parse(headerLine, { header: false }).data[0] ?? [];
  const headerValidation = validatePlayActivityHeaders(headers);
  if (!headerValidation.ok) {
    throw new Error(headerValidation.message);
  }

  const rows = await parsePlayActivityCsv(csvText, onProgress);
  const rowValidation = validatePlayActivityRows(rows);
  if (!rowValidation.ok) {
    throw new Error(rowValidation.message);
  }

  return { rows, sourcePath: found.path };
}

/**
 * Load one or more ZIP parts / CSV files.
 * @param {File | File[]} input
 * @param {(progress: { phase: string, percent?: number }) => void} [onProgress]
 * @returns {Promise<{ rows: Record<string, string>[], sourcePath: string }>}
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
    const found = findPlayActivityInZip(merged);
    if (!found) {
      throw new Error(
        'No "Apple Music Play Activity.csv" found across the uploaded ZIP parts. ' +
          'Upload the CSV from Apple Music Activity folder directly.',
      );
    }
    const csvText = decodeUtf8(found.data);
    const rows = await parsePlayActivityCsv(csvText, onProgress);
    const rowValidation = validatePlayActivityRows(rows);
    if (!rowValidation.ok) {
      throw new Error(rowValidation.message);
    }
    return { rows, sourcePath: found.path };
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
