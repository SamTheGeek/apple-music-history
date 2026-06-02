/**
 * Read a CSS custom property from :root for Chart.js (browser only).
 * @param {string} name e.g. '--chart-line-play'
 * @param {string} fallback
 * @returns {string}
 */
export function getCssColorVar(name, fallback) {
  if (typeof document === 'undefined') {
    return fallback;
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || fallback;
}
