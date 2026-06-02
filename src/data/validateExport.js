import { isPlayActivityPath, validateHeaders } from './schema/playActivity.js';

/**
 * @param {string[]} headers
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validatePlayActivityHeaders(headers) {
  if (!headers || headers.length === 0) {
    return { ok: false, message: 'The file has no column headers. Is this a valid CSV export?' };
  }

  const { missing } = validateHeaders(headers);

  if (missing.length > 0) {
    return {
      ok: false,
      message:
        `This export is missing expected columns: ${missing.join(', ')}. ` +
        'Apple may have changed the export format — see docs/apple-export-format.md or run scripts/inspect-export-headers.mjs on your file.',
    };
  }

  return { ok: true };
}

/**
 * @param {Record<string, string>[]} rows
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validatePlayActivityRows(rows) {
  if (!rows || rows.length === 0) {
    return { ok: false, message: 'The file contains no data rows.' };
  }

  const headers = Object.keys(rows[0] ?? {});
  return validatePlayActivityHeaders(headers);
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isPlayActivityFilePath(path) {
  return isPlayActivityPath(path);
}
