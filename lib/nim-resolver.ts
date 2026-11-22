import { normalizeNimName } from "./nim-identity";
import { validAddress, normalAddress } from "./finance";

// Pigeon is a community registry, not an official Nimiq namespace.
const PROVIDER = "https://signal.heylogram.tv/pigeonapi";
export type NameRecord = { name: string; address: string; provider: "Pigeon" };
export function parsePigeonRecord(name: string, raw: unknown): NameRecord {
  if (!raw || typeof raw !== "object") throw new Error("Name registry returned an invalid response.");
  const data = raw as Record<string, unknown>;
  // Pigeon documents the owner address as the name record's owner.
  const candidate = typeof data.owner === "string" ? data.owner : typeof data.address === "string" ? data.address : null;
  if (!candidate || !validAddress(candidate)) throw new Error("This name has no verified Nimiq payment address.");
  if (data.free === true || data.reserved === true || data.invalid === true || data.status === "free" || data.status === "reserved" || data.status === "invalid") throw new Error("This name is not registered.");
  return { name: normalizeNimName(name), address: normalAddress(candidate), provider: "Pigeon" };
}
export async function resolvePigeonName(name: string): Promise<NameRecord> {
  const normalized = normalizeNimName(name);
  const response = await fetch(`${PROVIDER}/api/name/${encodeURIComponent(normalized)}`, {
    cache: "no-store", signal: AbortSignal.timeout(6500), headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("The name registry is unavailable. Use a verified Nimiq address instead.");
  return parsePigeonRecord(normalized, await response.json());
}
