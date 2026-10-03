import crypto from "node:crypto";

// No 0/O, 1/I/L so references are easy to read over the phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** e.g. JMT-261003-7KQ4M */
export function makeReference(now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  const bytes = crypto.randomBytes(5);
  const suffix = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `JMT-${d}-${suffix}`;
}

export const REFERENCE_PATTERN = /^JMT-\d{6}-[2-9A-HJKMNP-Z]{5}$/;
