/**
 * Builds the web logo assets from the client's own full-colour logo
 * (brand-source/jmt-enterprise-logo-client.png: navy, red and white on a white
 * background). Re-run after replacing it:
 *   node scripts/brand-assets.mjs
 */
import sharp from "sharp";

const SRC = "brand-source/jmt-enterprise-logo-client.png";
const NAVY = "#0c2650"; // measured from the logo
const PAD = 16;

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (x, y) => (y * W + x) * 3;
const isPaper = (i) => data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238;

/**
 * Makes only the outer white background transparent (flood fill from the
 * edges), so the white trucks inside the logo stay white.
 */
const alpha = Buffer.alloc(W * H, 255);
const stack = [];
for (let x = 0; x < W; x++) stack.push([x, 0], [x, H - 1]);
for (let y = 0; y < H; y++) stack.push([0, y], [W - 1, y]);
while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const k = y * W + x;
  if (alpha[k] === 0 || !isPaper(px(x, y))) continue;
  alpha[k] = 0;
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}
const rgba = Buffer.alloc(W * H * 4);
for (let k = 0; k < W * H; k++) {
  rgba[k * 4] = data[k * 3];
  rgba[k * 4 + 1] = data[k * 3 + 1];
  rgba[k * 4 + 2] = data[k * 3 + 2];
  rgba[k * 4 + 3] = alpha[k];
}
const transparent = () => sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
const onWhite = () => sharp(SRC).removeAlpha();

/** Bounding box of the artwork inside a band of rows, with padding. */
function bbox(y0 = 0, y1 = H, pad = PAD) {
  let minx = W, maxx = 0, miny = H, maxy = 0;
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < W; x++)
      if (alpha[y * W + x] && !isPaper(px(x, y))) {
        minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
      }
  const left = Math.max(0, minx - pad), top = Math.max(0, miny - pad);
  return { left, top, width: Math.min(W, maxx + pad + 1) - left, height: Math.min(H, maxy + pad + 1) - top };
}

const full = bbox();
// The "JMT" letters sit between the trucks and "ENTERPRISE LLC", flanked by
// speed stripes; the icon uses the letters alone (measured column range).
const band = bbox(Math.round(H * 0.58), Math.round(H * 0.78), 6);
const wordmark = { left: Math.round(W * 0.227), top: band.top, width: Math.round(W * 0.551), height: band.height };

const save = async (img, region, width, file) => {
  const buf = await img.extract(region).png().toBuffer();
  await sharp(buf).resize({ width }).png({ compressionLevel: 9 }).toFile(file);
};
await save(transparent(), full, 640, "public/brand/jmt-logo.png");
await save(onWhite(), full, 480, "public/brand/jmt-logo-email.png");

// Square icons: the "JMT" wordmark on a white tile with a navy edge.
const mark = await transparent().extract(wordmark).png().toBuffer();
async function icon(size, file, radius) {
  const inner = Math.round(size * 0.9);
  const glyph = await sharp(mark).resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const border = Math.round(size * 0.035);
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect x="${border / 2}" y="${border / 2}" width="${size - border}" height="${size - border}" rx="${radius}" fill="#fff" stroke="${NAVY}" stroke-width="${border}"/></svg>`,
  );
  await sharp(tile).composite([{ input: glyph, gravity: "center" }]).png().toFile(file);
}
await icon(512, "src/app/icon.png", 112);
await icon(180, "src/app/apple-icon.png", 0); // iOS rounds the corners itself
await icon(512, "public/brand/jmt-mark-tile.png", 112);
console.log("logo", full, "wordmark", wordmark);
