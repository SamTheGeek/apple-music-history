/**
 * Rasterize assets/icons/app-icon.svg into PNG + ICO files under public/.
 * Run via npm predev / prebuild / prestart (see package.json).
 */
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'assets/icons/app-icon.svg');
const publicDir = join(root, 'public');

const resvgOpts = (width) => ({
  fitTo: { mode: 'width', value: width },
  font: { loadSystemFonts: false },
});

function renderPng(svgBuffer, width) {
  const resvg = new Resvg(svgBuffer, resvgOpts(width));
  return resvg.render().asPng();
}

/** @type {Array<[string, number]>} */
const pngOutputs = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['favicon-96x96.png', 96],
  ['android-icon-36x36.png', 36],
  ['android-icon-48x48.png', 48],
  ['android-icon-72x72.png', 72],
  ['android-icon-96x96.png', 96],
  ['android-icon-144x144.png', 144],
  ['android-icon-192x192.png', 192],
  ['apple-icon-57x57.png', 57],
  ['apple-icon-60x60.png', 60],
  ['apple-icon-72x72.png', 72],
  ['apple-icon-76x76.png', 76],
  ['apple-icon-114x114.png', 114],
  ['apple-icon-120x120.png', 120],
  ['apple-icon-144x144.png', 144],
  ['apple-icon-152x152.png', 152],
  ['apple-icon-180x180.png', 180],
  ['ms-icon-70x70.png', 70],
  ['ms-icon-144x144.png', 144],
  ['ms-icon-150x150.png', 150],
  ['ms-icon-310x310.png', 310],
];

async function main() {
  const svgBuffer = await readFile(svgPath);

  for (const [filename, size] of pngOutputs) {
    const png = renderPng(svgBuffer, size);
    await writeFile(join(publicDir, filename), png);
  }

  const apple180 = renderPng(svgBuffer, 180);
  await writeFile(join(publicDir, 'apple-icon.png'), apple180);
  await writeFile(join(publicDir, 'apple-icon-precomposed.png'), apple180);

  const icoSizes = [64, 48, 32, 16];
  const icoBuffers = icoSizes.map((w) => renderPng(svgBuffer, w));
  const ico = await toIco(icoBuffers);
  await writeFile(join(publicDir, 'favicon.ico'), ico);

  await copyFile(svgPath, join(publicDir, 'favicon.svg'));

  console.log(
    `rasterize-app-icons: wrote ${pngOutputs.length + 3} files + favicon.ico + favicon.svg from assets/icons/app-icon.svg`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
