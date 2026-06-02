import { CANONICAL_FIELDS, resolveCanonicalHeader } from './schema/playActivity.js';

const UNKNOWN_ARTIST = 'Unknown Artist';

/**
 * Derive display artist from row fields (2026 exports often omit Artist Name).
 * @param {Record<string, string>} row
 * @returns {string}
 */
export function deriveArtistName(row) {
  const direct = row[CANONICAL_FIELDS.artistName]?.trim();
  if (direct) {
    return direct;
  }
  const container = row['Container Artist Name']?.trim();
  if (container) {
    return container;
  }
  return UNKNOWN_ARTIST;
}

/**
 * Remap a raw PapaParse row to canonical column names.
 * @param {Record<string, string>} rawRow
 * @returns {Record<string, string>}
 */
export function normalizePlayRow(rawRow) {
  const out = { ...rawRow };
  for (const [key, value] of Object.entries(rawRow)) {
    const canonical = resolveCanonicalHeader(key);
    if (canonical && canonical !== key) {
      if (canonical === CANONICAL_FIELDS.artistName && out[canonical]) {
        continue;
      }
      out[canonical] = value;
    }
  }
  out[CANONICAL_FIELDS.artistName] = deriveArtistName(out);
  return out;
}

/**
 * @param {Record<string, string>[]} rows
 * @returns {Record<string, string>[]}
 */
export function normalizePlayRows(rows) {
  return rows.map(normalizePlayRow);
}

/**
 * @param {string[]} headers
 * @returns {string[]}
 */
export function normalizeHeaders(headers) {
  return headers.map((h) => resolveCanonicalHeader(h) || h);
}

export { CANONICAL_FIELDS, UNKNOWN_ARTIST };
