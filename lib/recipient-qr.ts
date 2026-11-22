import { normalAddress, validAddress } from "./finance";
import { isNimName, normalizeNimName } from "./nim-identity";
import { isEvmAddress } from "./polygon-usdt";

function nimRecipient(value: string): string | null {
  if (validAddress(value)) return normalAddress(value);
  return isNimName(value) ? normalizeNimName(value) : null;
}

/** Import only the recipient. Never follow a scanned link or import payment instructions. */
export function parseRecipientQR(raw: string, network: "NIM" | "USDT"): string | null {
  const value = raw.trim();
  if (!value || value.length > 4096 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  if (network === "NIM") {
    const recipient = nimRecipient(value);
    if (recipient) return recipient;
  } else {
    if (isEvmAddress(value)) return value;
    const match = /^(?:ethereum|polygon):(0x[\da-f]{40})@137(?:\?[^#]*)?$/i.exec(value);
    return match?.[1] ?? null;
  }

  try {
    const uri = new URL(value);
    if (uri.username || uri.password || uri.port) return null;
    if (uri.protocol === "https:" && uri.hostname === "wallet.nimiq.com" && uri.pathname === "/") {
      const recipient = /^#_request\/([^/]+)(?:\/|$)/.exec(uri.hash)?.[1];
      return recipient ? nimRecipient(decodeURIComponent(recipient)) : null;
    }
    if (uri.protocol !== "nimiq:" && uri.protocol !== "nimiqpay:") return null;
    const path = decodeURIComponent(uri.pathname.replace(/^\/+/, "").replace(/^pay\//i, ""));
    const fields = ["address", "recipient", "to"].flatMap(key => uri.searchParams.getAll(key));
    const authority = uri.hostname.toLowerCase();
    const isAction = (part: string) => ["", "pay", "send"].includes(part.toLowerCase());
    if (uri.hash) return null;
    if (!isAction(path)) fields.push(path);
    if (!isAction(authority)) fields.push(authority);
    const recipients = fields.map(nimRecipient);
    return recipients.length && recipients[0] && recipients.every(recipient => recipient === recipients[0])
      ? recipients[0] : null;
  } catch {
    return null;
  }
}
