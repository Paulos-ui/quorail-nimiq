"use client";
import { useCallback, useEffect, useState } from "react";
import { formatUsdt, isEvmAddress, polygonBalance, requirePolygon, type EvmProvider } from "@/lib/polygon-usdt";
import { nim } from "@/lib/finance";
import { ApproxAmount } from "./LocalCurrency";

type Asset = "NIM" | "USDT";
type WalletWindow = Window & { ethereum?: EvmProvider };
type BalanceStatus = "idle" | "loading" | "connected" | "unavailable" | "error";

export default function AssetBalanceCard({ nimBalance, nimCommitted, nimReserve, horizon, onSettings }: {
  nimBalance: number | null; nimCommitted: number; nimReserve: number; horizon: number; onSettings: () => void;
}) {
  const [asset, setAsset] = useState<Asset>("NIM");
  const [account, setAccount] = useState("");
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<BalanceStatus>("idle");
  const [error, setError] = useState("");

  const refresh = useCallback(async (requestAccess: boolean) => {
    setStatus("loading"); setError("");
    const provider = (window as WalletWindow).ethereum;
    if (!provider) {
      setAccount(""); setUsdtBalance(null); setStatus("unavailable");
      setError("This browser has no compatible Polygon wallet. Open Quorail in a supported EVM wallet to view and send USDT.");
      return;
    }
    try {
      const accounts = await provider.request({ method: requestAccess ? "eth_requestAccounts" : "eth_accounts" });
      if (!Array.isArray(accounts) || !isEvmAddress(accounts[0])) {
        setAccount(""); setUsdtBalance(null); setStatus("idle");
        return;
      }
      const selected = accounts[0] as string;
      const chain = await provider.request({ method: "eth_chainId" });
      if (chain !== "0x89") {
        if (!requestAccess) {
          setAccount(selected); setUsdtBalance(null); setStatus("idle");
          setError("Connect on Polygon to check this account's USDT.");
          return;
        }
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x89" }] });
      }
      await requirePolygon(provider);
      const balance = await polygonBalance(provider, selected);
      setAccount(selected); setUsdtBalance(formatUsdt(balance)); setStatus("connected");
    } catch (e) {
      setUsdtBalance(null); setStatus("error");
      setError(e instanceof Error ? e.message : "Could not verify the Polygon USDT balance.");
    }
  }, []);

  useEffect(() => { if (asset === "USDT") void refresh(false); }, [asset, refresh]);
  useEffect(() => {
    const refreshBalance = () => { if (asset === "USDT") void refresh(false); };
    window.addEventListener("quorail:usdt-confirmed", refreshBalance);
    const provider = (window as WalletWindow).ethereum as (EvmProvider & {
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
    }) | undefined;
    provider?.on?.("accountsChanged", refreshBalance);
    provider?.on?.("chainChanged", refreshBalance);
    return () => {
      window.removeEventListener("quorail:usdt-confirmed", refreshBalance);
      provider?.removeListener?.("accountsChanged", refreshBalance);
      provider?.removeListener?.("chainChanged", refreshBalance);
    };
  }, [asset, refresh]);

  return <section className="balance-card multi-asset-balance" aria-label="Wallet balances">
    <div className="card-label"><span>YOUR WALLET BALANCE</span><div className="asset-card-toggle" role="group" aria-label="Balance currency">
      <button type="button" className={asset === "NIM" ? "selected" : ""} aria-pressed={asset === "NIM"} onClick={() => setAsset("NIM")}>NIM</button>
      <button type="button" className={asset === "USDT" ? "selected" : ""} aria-pressed={asset === "USDT"} onClick={() => setAsset("USDT")}>USDT</button>
    </div></div>
    {asset === "NIM" ? <>
      <div className="big-number">{nimBalance === null ? "Unavailable" : nim(nimBalance)}<span> NIM</span></div>
      <ApproxAmount amount={nimBalance} />
      <div className="allocation-bar"><i style={{width: `${Math.min(100, Math.max(0, (nimCommitted / (nimBalance || 1)) * 100))}%`}} /><i style={{width: `${Math.min(100, Math.max(0, (nimReserve / (nimBalance || 1)) * 100))}%`}} /></div>
      <div className="balance-breakdown"><div><span>● Committed</span><b>{nim(nimCommitted)} <small>NIM</small></b></div><div><span>● Reserve target</span><b>{nim(nimReserve)} <small>NIM</small></b></div></div>
      <div className="balance-foot">{horizon}-day planning window <button type="button" aria-label="Change planning window" onClick={onSettings}>⚙</button></div>
    </> : <div className="usdt-balance-content">
      <div className="usdt-balance-status"><span className={status === "connected" ? "usdt-status-dot online" : "usdt-status-dot"} />{status === "connected" ? "Polygon wallet connected" : status === "loading" ? "Checking your wallet" : "Connect to view your USDT"}</div>
      {status === "connected" && usdtBalance !== null ? <>
        <div className="big-number usdt-balance-number">{usdtBalance}<span> USDT</span></div>
        <ApproxAmount amount={Number(usdtBalance.replaceAll(",", ""))} asset="USDT" />
        <div className="usdt-balance-detail"><span>Polygon PoS</span><span title={account}>{account.slice(0, 6)}…{account.slice(-4)}</span></div>
        <p className="usdt-balance-caption">On-chain USDT balance · Separate from your NIM plan.</p>
        <button type="button" className="usdt-card-secondary" onClick={() => void refresh(false)}>↻ Refresh balance</button>
      </> : <>
        <p className="usdt-balance-prompt">Your Polygon USDT balance, ready when you connect.</p>
        <button type="button" className="usdt-card-connect" disabled={status === "loading"} onClick={() => void refresh(true)}>{status === "loading" ? "Connecting…" : "Connect Polygon wallet →"}</button>
        <p className="usdt-balance-caption">Polygon PoS · A compatible EVM wallet is required.</p>
      </>}
      {error && <p className="asset-card-error" role="status">{error}</p>}
    </div>}
  </section>;
}
