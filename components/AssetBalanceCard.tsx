"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatUsdt, isEvmAddress, polygonBalance, POLYGON_CHAIN_ID, type EvmProvider } from "@/lib/polygon-usdt";
import { nim } from "@/lib/finance";
import { ApproxAmount, WalletCurrencyControls } from "./LocalCurrency";

type Asset = "NIM" | "USDT";
type WalletWindow = Window & { ethereum?: EvmProvider };
type BalanceStatus = "idle" | "loading" | "connected" | "unavailable" | "wrong-network" | "error";

export default function AssetBalanceCard({ nimBalance, nimCommitted, nimReserve, horizon, onSettings }: {
  nimBalance: number | null; nimCommitted: number; nimReserve: number; horizon: number; onSettings: () => void;
}) {
  const [asset, setAsset] = useState<Asset>("NIM");
  const [account, setAccount] = useState("");
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<BalanceStatus>("idle");
  const [error, setError] = useState("");

  const requestId = useRef(0);

  const refresh = useCallback(async (requestAccess: boolean) => {
    const id = ++requestId.current;
    const current = () => id === requestId.current;
    setStatus("loading"); setError(""); setUsdtBalance(null);
    const provider = (window as WalletWindow).ethereum;
    if (!provider) {
      setAccount(""); setUsdtBalance(null); setStatus("unavailable");
      setError("This browser has no compatible Polygon wallet. Open Quorail in a supported EVM wallet to view and send USDT.");
      return;
    }
    try {
      const accounts = await provider.request({ method: requestAccess ? "eth_requestAccounts" : "eth_accounts" });
      if (!current()) return;
      if (!Array.isArray(accounts) || !isEvmAddress(accounts[0])) {
        setAccount(""); setUsdtBalance(null); setStatus("idle");
        return;
      }
      const selected = accounts[0] as string;
      const chain = await provider.request({ method: "eth_chainId" });
      if (!current()) return;
      if (typeof chain !== "string" || chain.toLowerCase() !== POLYGON_CHAIN_ID) {
        if (!requestAccess) {
          setAccount(selected); setStatus("wrong-network");
          return;
        }
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON_CHAIN_ID }] });
      }
      if (!current()) return;
      const balance = await polygonBalance(provider, selected);
      if (!current()) return;
      setAccount(selected); setUsdtBalance(formatUsdt(balance)); setStatus("connected");
    } catch (e) {
      if (!current()) return;
      setUsdtBalance(null); setStatus("error");
      setError(e instanceof Error ? e.message : "Could not verify the Polygon USDT balance.");
    }
  }, []);

  useEffect(() => {
    if (asset !== "USDT") return;
    const refreshBalance = () => { void refresh(false); };
    const disconnect = () => {
      requestId.current++;
      setAccount(""); setUsdtBalance(null); setStatus("idle"); setError("");
    };
    window.addEventListener("quorail:usdt-confirmed", refreshBalance);
    const provider = (window as WalletWindow).ethereum as (EvmProvider & {
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
    }) | undefined;
    provider?.on?.("accountsChanged", refreshBalance);
    provider?.on?.("chainChanged", refreshBalance);
    provider?.on?.("disconnect", disconnect);
    refreshBalance();
    return () => {
      requestId.current++;
      provider?.removeListener?.("disconnect", disconnect);
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
      <WalletCurrencyControls />
      <div className="allocation-bar"><i style={{width: `${Math.min(100, Math.max(0, (nimCommitted / (nimBalance || 1)) * 100))}%`}} /><i style={{width: `${Math.min(100, Math.max(0, (nimReserve / (nimBalance || 1)) * 100))}%`}} /></div>
      <div className="balance-breakdown"><div><span>● Committed</span><b>{nim(nimCommitted)} <small>NIM</small></b></div><div><span>● Reserve target</span><b>{nim(nimReserve)} <small>NIM</small></b></div></div>
      <div className="balance-foot">{horizon}-day planning window <button type="button" aria-label="Change planning window" onClick={onSettings}>⚙</button></div>
    </> : <div className={`usdt-balance-content${status === "connected" ? "" : " usdt-balance-disconnected"}`}>
      <div className="usdt-balance-status"><span className={status === "connected" ? "usdt-status-dot online" : "usdt-status-dot"} />{status === "connected" ? "Polygon wallet connected" : status === "loading" ? "Checking your wallet" : status === "wrong-network" ? "Switch your wallet to Polygon" : "Polygon wallet not connected"}</div>
      {status === "connected" && usdtBalance !== null ? <>
        <div className="big-number usdt-balance-number">{usdtBalance}<span> USDT</span></div>
        <ApproxAmount amount={Number(usdtBalance)} asset="USDT" />
        <WalletCurrencyControls asset="USDT" />
        <div className="usdt-balance-detail"><span>Polygon PoS</span><span title={account}>{account.slice(0, 6)}…{account.slice(-4)}</span></div>
        <p className="usdt-balance-caption">On-chain USDT balance · Separate from your NIM plan.</p>
        <button type="button" className="usdt-card-secondary" onClick={() => void refresh(false)}>↻ Refresh balance</button>
      </> : <>
        <p className="usdt-balance-prompt">Connect a compatible wallet to view your USDT balance and make payments.</p>
        <button type="button" className="usdt-card-connect" disabled={status === "loading"} onClick={() => void refresh(true)}>{status === "loading" ? "Connecting…" : status === "wrong-network" ? "Switch to Polygon" : "Connect Polygon wallet"}</button>
        <p className="usdt-balance-caption">Polygon network · Wallet approval required for payments</p>
        <WalletCurrencyControls asset="USDT" />
      </>}
      {error && <p className="asset-card-error" role="status">{error}</p>}
    </div>}
  </section>;
}
