import { createHash } from "node:crypto";
export async function redis(command: (string | number)[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL,
    token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token)
    throw new Error(
      "Shared boards need the deployment Redis settings. Private plans still work.",
    );
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error("Shared storage unavailable.");
  const data = await r.json();
  if (data.error) throw new Error("Shared storage unavailable.");
  return data.result;
}
export function boardKey(secret: string) {
  if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error("Invalid invite link.");
  return "quorail:board:" + createHash("sha256").update(secret).digest("hex");
}
export async function smallJson(req: Request, max = 24000) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let count = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      count += r.value.length;
      if (count > max) {
        await reader.cancel();
        throw new Error("Request too large");
      }
      chunks.push(r.value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
