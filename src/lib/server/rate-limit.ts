/**
 * Fixed-window rate limiter keyed by client IP.
 *
 * With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, counts are
 * kept in a shared Redis so the limit holds across serverless instances.
 * Without them it falls back to an in-memory map, which only limits a single
 * instance; put the host's firewall rate limits in front in that case.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

async function redisLimit(url: string, token: string, key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify([
      ["INCR", windowKey],
      ["PEXPIRE", windowKey, String(windowMs)],
    ]),
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) throw new Error(`rate limit store returned ${res.status}`);
  const [incr] = (await res.json()) as { result: number }[];
  return incr.result <= limit;
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return await redisLimit(url, token, key, limit, windowMs);
    } catch (e) {
      // Never turn away real customers because the limiter is down.
      console.error("[rate-limit] shared store unavailable, using in-memory limit:", e instanceof Error ? e.message : e);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
