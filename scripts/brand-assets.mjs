/**
 * Builds the web logo assets from the client's original logo
 * (brand-source/jmt-enterprise-logo-original.png). Re-run after replacing it:
 *   node scripts/brand-assets.mjs
 */
import sharp from "sharp";

const SRC = "brand-source/jmt-enterprise-logo-original.png";
const BLUE = [0x16, 0x5d, 0xd6]; // measured from the logo
const PAD = 12;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

/** Recolours every pixel to one flat colour, keeping anti-aliased edges and dropping faint noise. */
function tinted(rgb) {
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] < 48 ? 0 : data[i + 3];
    out[i] = rgb[0];
    out[i + 1] = rgb[1];
    out[i + 2] = rgb[2];
    out[i + 3] = a;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
}

function bbox(x0, x1) {
  let minx = 1e9, maxx = 0, miny = 1e9, maxy = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = x0; x < x1; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
      }
  return { left: Math.max(0, minx - PAD), top: Math.max(0, miny - PAD), width: Math.min(info.width, maxx + PAD + 1) - Math.max(0, minx - PAD), height: Math.min(info.height, maxy + PAD + 1) - Math.max(0, miny - PAD) };
}

// The box mark ends at the first fully empty column before the "J".
let split = 0;
for (let x = 600; x < info.width && !split; x++) {
  let any = false;
  for (let y = 0; y < info.height && !any; y++) any = data[(y * info.width + x) * 4 + 3] > 128;
  if (!any) split = x;
}
const full = bbox(0, info.width);
const markBox = bbox(0, split);
// Keep the padding from reaching into the "J".
const mark = { ...markBox, width: Math.min(markBox.width, split - markBox.left) };

const save = async (img, region, width, file) => {
  const buf = await img.extract(region).png().toBuffer();
  await sharp(buf).resize({ width }).png({ compressionLevel: 9, palette: true }).toFile(file);
};
const white = [255, 255, 255];
await save(tinted(BLUE), full, 720, "public/brand/jmt-logo.png");
await save(tinted(white), full, 720, "public/brand/jmt-logo-white.png");
await save(tinted(BLUE), full, 480, "public/brand/jmt-logo-email.png");

// Square icons: white mark on a royal-blue rounded tile.
const markWhite = await tinted(white).extract(mark).png().toBuffer();
async function icon(size, file, radius) {
  const inner = Math.round(size * 0.72);
  const glyph = await sharp(markWhite).resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="rgb(${BLUE.join(",")})"/></svg>`);
  await sharp(tile).composite([{ input: glyph, gravity: "center" }]).png().toFile(file);
}
await icon(512, "src/app/icon.png", 112);
await icon(180, "src/app/apple-icon.png", 0); // iOS rounds the corners itself
await icon(512, "public/brand/jmt-mark-tile.png", 112);
console.log("logo", full, "mark", mark);
