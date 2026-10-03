/**
 * Server-side photo validation. The declared type and extension are never
 * trusted: the file's magic bytes must match JPEG, PNG or WebP, sharp must be
 * able to decode it within the pixel limits, and the stored copy is
 * re-encoded as JPEG, which drops EXIF data including GPS location.
 */
import sharp from "sharp";
import { PHOTO_LIMITS } from "@/lib/quote/options";

export class ImageRejectedError extends Error {}

export function sniffImageType(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  return null;
}

export async function processImage(buf: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  if (buf.length === 0) throw new ImageRejectedError("The file is empty.");
  if (buf.length > PHOTO_LIMITS.maxBytesEach) throw new ImageRejectedError("The photo is larger than 10 MB.");
  if (!sniffImageType(buf)) {
    throw new ImageRejectedError("Only JPEG, PNG and WebP photos are accepted. iPhone HEIC photos can be shared as JPEG.");
  }

  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(buf, { limitInputPixels: PHOTO_LIMITS.maxPixels }).metadata();
  } catch {
    throw new ImageRejectedError("This photo could not be read. Please try a different image.");
  }
  if (!meta.width || !meta.height || meta.width > PHOTO_LIMITS.maxSide || meta.height > PHOTO_LIMITS.maxSide) {
    throw new ImageRejectedError("The photo's dimensions are too large.");
  }

  try {
    const { data, info } = await sharp(buf, { limitInputPixels: PHOTO_LIMITS.maxPixels })
      .rotate() // apply EXIF orientation before metadata is dropped
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw new ImageRejectedError("This photo could not be processed. Please try a different image.");
  }
}
