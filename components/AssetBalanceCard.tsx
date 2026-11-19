"use client";
import { useCallback, useEffect, useState } from "react";
import { formatUsdt, isEvmAddress, polygonBalance, requirePolygon, type EvmProvider } from "@/lib/polygon-usdt";
import { nim } from "@/lib/finance";

type Asset = "NIM" | "USDT";
type WalletWindow = Window & { ethereum?: EvmProvider };
export default function AssetBalanceCard({ nimBalance, nimCommitted, nimReserve, horizon, onSettings }: {
  nimBalance: number | null; nimCommitted: number; nimReserve: number; horizon: number; onSettings: () => void;
}) {
  const [asset, setAsset] = useState<Asset>("NIM");
  const [account, setAccount] = useState("");
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async (requestAccess: boolean) => {
    const provider = (window as WalletWindow).ethereum;
    if (!provider) { setError("USDT balance requires a compatible Polygon wallet. This Nimiq Pay browser may not expose one."); return; }
    setLoading(true); setError("");
    try {
      const chain = await provider.request({ method: "eth_chainId" });
      if (chain !== "0x89") {
        if (!requestAccess) { setError("Connect your Polygon wallet to view USDT."); return; }
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x89" }] });
      }
      await requirePolygon(provider);
      const accounts = await provider.request({ method: requestAccess ? "eth_requestAccounts" : "eth_accounts" });
      if (!Array.isArray(accounts) || !isEvmAddress(accounts[0])) { setError("Connect a Polygon account to view USDT."); return; }
      setAccount(accounts[0]);
      setUsdtBalance(formatUsdt(await polygonBalance(provider, accounts[0])));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read USDT balance."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (asset !== "USDT") return;
    void refresh(false);
  }, [asset, refresh]);
  useEffect(() => {
    const listener = () => { if (asset === "USDT") void refresh(false); };
    window.addEventListener("quorail:usdt-confirmed", listener);
    return () => window.removeEventListener("quorail:usdt-confirmed", listener);
  }, [asset, refresh]);
  return <section className="balance-card multi-asset-balance" aria-label="Wallet balances">
    <div className="card-label"><span>YOUR WALLET BALANCE</span><div className="asset-card-toggle" role="group" aria-label="Balance currency">
      <button type="button" className={asset === "NIM" ? "selected" : ""} aria-pressed={asset === "NIM"} onClick={() => setAsset("NIM")}>NIM</button>
      <button type="button" className={asset === "USDT" ? "selected" : ""} aria-pressed={asset === "USDT"} onClick={() => setAsset("USDT")}>USDT</button>
    </div></div>
    {asset === "NIM" ? <>
      <div className="big-number">{nimBalance === null ? "Unavailable" : nim(nimBalance)}<span> NIM</span></div>
      <div className="allocation-bar"><i style={{width: `${Math.min(100, Math.max(0, (nimCommitted / (nimBalance || 1)) * 100))}%`}} /><i style={{width: `${Math.min(100, Math.max(0, (nimReserve / (nimBalance || 1)) * 100))}%`}} /></div>
      <div className="balance-breakdown"><div><span>● Committed</span><b>{nim(nimCommitted)} <small>NIM</small></b></div><div><span>● Reserve target</span><b>{nim(nimReserve)} <small>NIM</small></b></div></div>
      <div className="balance-foot">{horizon}-day planning window <button type="button" aria-label="Change planning window" onClick={onSettings}>⚙</button></div>
    </> : <>
      <div className="big-number">{usdtBalance === null ? "—" : usdtBalance}<span> USDT</span></div>
      <p className="asset-card-description">Polygon USDT balance, read directly from your connected wallet.</p>
      <div className="balance-breakdown"><div><span>Network</span><b>Polygon PoS</b></div><div><span>Account</span><b>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Not connected"}</b></div></div>
      {error && <p className="asset-card-error" role="status">{error}</p>}
      <div className="balance-foot"><span>USDT planning and reserves are not yet available.</span><button type="button" disabled={loading} onClick={() => void refresh(true)}>{loading ? "Checking…" : account ? "Refresh" : "Connect"}</button></div>
    </>}
  </section>;
}
