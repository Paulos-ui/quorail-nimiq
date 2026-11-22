import type { EvmProvider } from "./polygon-usdt";
export function polygonRequestRpc(): EvmProvider {
  const url = process.env.POLYGON_RPC_URL;
  if (!url)
    throw new Error(
      "Polygon request verification is unavailable. Configure POLYGON_RPC_URL on the deployment.",
    );
  return {
    async request({ method, params = [] }) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok)
        throw new Error("Polygon receipt service temporarily unavailable.");
      const data = await res.json();
      if (data.error || !("result" in data))
        throw new Error(
          "Polygon receipt service could not verify this payment yet.",
        );
      return data.result;
    },
  };
}
