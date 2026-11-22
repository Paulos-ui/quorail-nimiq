import type { Network } from "./wallet";
export async function rpc(
  network: Network,
  method: string,
  params: unknown[],
): Promise<unknown> {
  const endpoint =
    network === "mainnet"
      ? process.env.NEXT_PUBLIC_NIMIQ_MAINNET_RPC ||
        "https://rpc.nimiqwatch.com"
      : process.env.NEXT_PUBLIC_NIMIQ_TESTNET_RPC ||
        "https://rpc.testnet.nimiqwatch.com/";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok)
    throw new Error(
      "Receipt service is temporarily unavailable. Your payment will not be resent.",
    );
  const json = await res.json();
  if (json.error)
    throw new Error(
      json.error.message || "Transaction not yet found. Check again shortly.",
    );
  return json.result?.data;
}
