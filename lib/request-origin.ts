/** Check the browser origin against the routed host, including reverse proxies. */
export function sameOrigin(req: Request): boolean {
  const raw = req.headers.get("origin");
  if (!raw) return false;
  try {
    const origin = new URL(raw);
    const host = req.headers.get("host") || new URL(req.url).host;
    return ["https:", "http:"].includes(origin.protocol) && origin.host === host;
  } catch { return false; }
}
