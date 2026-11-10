import { init, getHostNetwork, NimiqProviderError } from "@nimiq/mini-app-sdk";
export type Provider = Awaited<ReturnType<typeof init>>;
export type Network = "mainnet" | "testnet";
export async function connectWallet() {
  const provider = await init({ timeout: 8000 });
  const network = getHostNetwork();
  if (!network)
    throw new Error(
      "Update Nimiq Pay. This version does not report its network, so Quorail cannot safely prepare payments.",
    );
  if (typeof provider.getBalance !== "function")
    throw new Error("Update Nimiq Pay to enable balance access.");
  provider.disconnect();
  const accounts = await provider.listAccounts();
  if (!accounts.length) throw new Error("No Nimiq accounts were shared.");
  if (!(await provider.isConsensusEstablished()))
    throw new Error(
      "Your wallet is syncing. Try again when Nimiq Pay is connected.",
    );
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
  return `https://nimpay.app/miniapps/open/${window.location.host}/console/`;
}
