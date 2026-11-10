import { normalAddress, type Payment } from "./finance";
export function verifyReceipt(
  raw: unknown,
  payment: Payment,
  address: string,
  network: "mainnet" | "testnet",
): {
  status: "pending" | "confirmed" | "failed" | "mismatch";
  sender?: string;
  fee?: number;
} {
  if (!raw || typeof raw !== "object") return { status: "pending" };
  const t = raw as Record<string, unknown>;
  if (
    typeof t.hash !== "string" ||
    t.hash.toLowerCase() !== payment.hash?.toLowerCase()
  )
    return { status: "mismatch" };
  if (
    typeof t.blockNumber !== "number" ||
    t.blockNumber <= 0 ||
    typeof t.confirmations !== "number" ||
    t.confirmations < 1
  )
    return { status: "pending" };
  if (t.networkId !== (network === "mainnet" ? 24 : 5))
    return { status: "mismatch" };
  const sender = typeof t.from === "string" ? t.from : "";
  if (
    normalAddress(sender) !== normalAddress(address) ||
    typeof t.to !== "string" ||
    normalAddress(t.to) !== normalAddress(payment.recipient) ||
    t.value !== payment.amount
  )
    return { status: "mismatch", sender };
  if (t.executionResult === false) return { status: "failed", sender };
  if (t.executionResult !== true) return { status: "pending" };
  return {
    status: "confirmed",
    sender,
    fee:
      typeof t.fee === "number" && Number.isSafeInteger(t.fee) && t.fee >= 0
        ? t.fee
        : undefined,
  };
}
