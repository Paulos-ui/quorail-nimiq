/** Resolve complete credential pairs only; never mix two database prefixes. */
export function redisConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const pairs = [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ];
  for (const [urlKey, tokenKey] of pairs) {
    const url = env[urlKey]?.trim(),
      token = env[tokenKey]?.trim();
    if (url && token) return { url, token };
  }
  return null;
}
