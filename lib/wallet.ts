import { init, getHostNetwork, NimiqProviderError } from "@nimiq/mini-app-sdk";
export type Provider = Awaited<ReturnType<typeof init>>;
export type Network = "mainnet" | "testnet";
export async function connectWallet() {
  let provider: Provider;
  try {
    provider = await init({ timeout: 8000 });
  } catch {
    throw new Error(
      "Open Nimiq Pay on your phone, go to Mini Apps, choose Custom URL and paste this website address. A regular browser cannot connect to the native wallet.",
    );
  }
  const network = getHostNetwork();
  if (!network)
    throw new Error(
      "Update Nimiq Pay. This version does not report its network, so Quorail cannot safely prepare payments.",
    );
  if (typeof provider.getBalance !== "function")
    throw new Error("Update Nimiq Pay to enable balance access.");
  const accounts = await provider.listAccounts();
  if (!accounts.length) throw new Error("No Nimiq accounts were shared.");
  return { provider, accounts, network };
}
export function checkNetwork(network: Network) {
  if (getHostNetwork() !== network)
    throw new Error(
      "Wallet network changed. Disconnect and reconnect before continuing.",
    );
}
export function errorMessage(e: unknown) {
  return NimiqProviderError.is(e) && e.type === "PERMISSION_DENIED"
    ? "Request cancelled. No new payment was approved."
    : e instanceof Error
      ? e.message
      : "The wallet could not complete this request.";
}
export const cancelled = (e: unknown) =>
  NimiqProviderError.is(e) && e.type === "PERMISSION_DENIED";
export const explorerUrl = (network: Network, hash: string) =>
  `https://${network === "testnet" ? "test." : ""}nimiq.watch/#${encodeURIComponent(hash)}`;
export function openWalletUrl() {
  return `https://nimpay.app/miniapps/open/${window.location.host}`;
}
