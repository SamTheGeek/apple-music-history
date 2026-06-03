const intFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Integers with grouping separators (e.g. 1,234). */
export function formatInteger(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return '0';
  }
  return intFormatter.format(Math.round(n));
}

/**
 * Total seconds → H:MM:SS (hours unpadded, minutes/seconds zero-padded), matching prior numeral output.
 */
export function formatDurationSeconds(totalSeconds) {
  const sec = Math.floor(Number(totalSeconds));
  if (!Number.isFinite(sec) || sec < 0) {
    return '0:00:00';
  }
  const s = sec % 60;
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
