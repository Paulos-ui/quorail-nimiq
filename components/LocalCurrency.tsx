"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { convertLocalAmount, formatLocalAmount, selectedRate, validateCurrencyRates, type Asset, type CurrencyCode as Code, type CurrencyRates as Rates } from "@/lib/validateCurrencyRates";
const validRates = validateCurrencyRates;
const codes: Code[] = ["NGN", "USD", "EUR", "GBP", "INR", "CAD"];
const CurrencyContext = createContext({ currency: "USD" as Code, enabled: true, setCurrency: (_:Code)=>{}, setEnabled: (_:boolean)=>{}, rates: null as Rates|null, now: 0 });
export function LocalCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency,setCurrency] = useState<Code>("USD");
  const [enabled,setEnabled] = useState(true);
  const [rates,setRates] = useState<Rates|null>(null);
  const [now, setNow] = useState(0);
  const [hydrated,setHydrated] = useState(false);
  useEffect(()=>{
    try {
      const saved=localStorage.getItem("quorail-local-currency");
      const detected=navigator.language.split("-")[1]?.toUpperCase();
      const map:Record<string,Code>={NG:"NGN",GB:"GBP",IN:"INR",US:"USD",CA:"CAD",DE:"EUR",FR:"EUR",ES:"EUR",IT:"EUR"};
      setCurrency(codes.includes(saved as Code)? saved as Code : map[detected] || "USD");
      setEnabled(localStorage.getItem("quorail-local-enabled")!=="false");
      localStorage.removeItem("quorail-local-rates-v5");
    } catch {}
    setHydrated(true);
    setNow(Date.now());
    const controller = new AbortController();
    let refreshing = false;
    async function updateRates() {
      if (refreshing) return;
      refreshing = true;
      try {
        const response = await fetch("/api/rates", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: unknown = response.ok ? await response.json() : null;
        if (!controller.signal.aborted) setRates(validRates(data) ? data : null);
      } catch {
        // A transport failure does not invalidate the previous quote. selectedRate enforces expiry.
      } finally {
        refreshing = false;
      }
    }
    void updateRates();
    const interval = setInterval(updateRates, 5 * 60 * 1000);
    const updateTime = () => setNow(Date.now());
    const clock = setInterval(updateTime, 1000);
    document.addEventListener("visibilitychange", updateTime);
    return () => {
      controller.abort();
      clearInterval(interval);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", updateTime);
    };
  },[]);
  useEffect(()=>{if(!hydrated)return;try{localStorage.setItem("quorail-local-currency",currency);localStorage.setItem("quorail-local-enabled",String(enabled));}catch{}},[currency,enabled,hydrated]);
  return <CurrencyContext.Provider value={{currency,enabled,setCurrency,setEnabled,rates,now}}>{children}</CurrencyContext.Provider>;
}
export function useLocalCurrency(){return useContext(CurrencyContext);}
export function ApproxAmount({ amount, asset = "NIM", signed = false }: { amount: number | null; asset?: Asset; signed?: boolean }) {
  const { currency, enabled, rates, now } = useLocalCurrency();
  if (!enabled || amount === null) return null;
  const rate = selectedRate(rates, asset, currency, now);
  const value = rate ? convertLocalAmount(amount, asset, rate, signed) : null;
  if (value === null || !rates) return <span className="quorail-approx">Rate temporarily unavailable</span>;
  return <span className="quorail-approx" title={`Rate checked ${new Date(rates.asOf).toLocaleString()}`}>
    ≈ {formatLocalAmount(value, currency)} <span>· Approx. for planning only</span>
  </span>;
}
export function WalletCurrencyControls({ asset = "NIM" }: { asset?: Asset }) {
 const {currency,enabled,setCurrency,setEnabled,rates,now}=useLocalCurrency();
 const rate = selectedRate(rates, asset, currency, now);
 return <details className="wallet-display-settings">
 <summary><span>Display currency</span><strong>{enabled ? currency : "Off"}</strong></summary>
 <div className="wallet-currency-controls">
 <div className="wallet-currency-select"><label htmlFor="wallet-local-currency">DISPLAY CURRENCY</label><select id="wallet-local-currency" value={currency} disabled={!enabled} onChange={e=>setCurrency(e.target.value as Code)}>{codes.map(code=><option key={code} value={code}>{code}</option>)}</select></div>
 <label className="wallet-currency-check"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Show local equivalent</label>
 <small>{enabled
   ? rate && rates
     ? `Approx. only · 1 ${asset} ≈ US$${rate.quote.value.toPrecision(4)} · Checked ${new Date(rates.asOf).toLocaleString()}`
     : "Rate temporarily unavailable"
   : "Local equivalents are off."}</small>
 </div></details>;
}
export function LocalCurrencySetting(){
 const {currency,enabled,setCurrency,setEnabled,rates}=useLocalCurrency();
 return <div className="quorail-local-settings"><div><strong>Local currency display</strong><small>Approx. for planning only. No fiat payments or conversion.</small></div>
 <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Show estimates</label>
 <label>Currency <select value={currency} disabled={!enabled} onChange={e=>setCurrency(e.target.value as Code)}>{codes.map(code=><option key={code} value={code}>{code}</option>)}</select></label>
 <small>{rates?`Rates checked ${new Date(rates.asOf).toLocaleString()}`:"Conversion estimates unavailable. Payments still work."}</small></div>;
}
