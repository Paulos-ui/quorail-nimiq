"use client";
import { createContext, useContext, useEffect, useState } from "react";
type Code = "NGN" | "USD" | "EUR" | "GBP" | "INR" | "CAD";
import { validateCurrencyRates, type CurrencyRates as Rates } from "@/lib/validateCurrencyRates";
const validRates = validateCurrencyRates;
const codes: Code[] = ["NGN", "USD", "EUR", "GBP", "INR", "CAD"];
const CurrencyContext = createContext({ currency: "USD" as Code, enabled: true, setCurrency: (_:Code)=>{}, setEnabled: (_:boolean)=>{}, rates: null as Rates|null, stale: false });
export function LocalCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency,setCurrency] = useState<Code>("USD");
  const [enabled,setEnabled] = useState(true);
  const [rates,setRates] = useState<Rates|null>(null);
  const [stale,setStale] = useState(false);
  const [hydrated,setHydrated] = useState(false);
  useEffect(()=>{
    try {
      const saved=localStorage.getItem("quorail-local-currency");
      const detected=navigator.language.split("-")[1]?.toUpperCase();
      const map:Record<string,Code>={NG:"NGN",GB:"GBP",IN:"INR",US:"USD",CA:"CAD",DE:"EUR",FR:"EUR",ES:"EUR",IT:"EUR"};
      setCurrency(codes.includes(saved as Code)? saved as Code : map[detected] || "USD");
      setEnabled(localStorage.getItem("quorail-local-enabled")!=="false");
      const cached=localStorage.getItem("quorail-local-rates-v4");
      if(cached){const data=JSON.parse(cached) as Rates;if(validRates(data)){setRates(data);setStale(false);}else{localStorage.removeItem("quorail-local-rates-v4");}}
    }catch{}
    setHydrated(true);
    let active=true;
    fetch("/api/rates",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return await r.json() as Rates;}).then(data=>{
      if(!active || !validRates(data))return;
      setRates(data);setStale(false);try{localStorage.setItem("quorail-local-rates-v4",JSON.stringify(data));}catch{}
    }).catch(()=>{});
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{if(!hydrated)return;try{localStorage.setItem("quorail-local-currency",currency);localStorage.setItem("quorail-local-enabled",String(enabled));}catch{}},[currency,enabled,hydrated]);
  return <CurrencyContext.Provider value={{currency,enabled,setCurrency,setEnabled,rates,stale}}>{children}</CurrencyContext.Provider>;
}
export function useLocalCurrency(){return useContext(CurrencyContext);}
export function ApproxAmount({ amount, asset="NIM" }: { amount:number|null; asset?:"NIM"|"USDT" }){
  const {currency,enabled,rates,stale}=useLocalCurrency();
  if(!enabled || amount===null || !Number.isFinite(amount) || !validRates(rates) || !(rates.usdToLocal[currency]>0))return null;
  const value=amount*(asset==="NIM"?rates.nimUsd:rates.usdtUsd)*rates.usdToLocal[currency];
  if(!Number.isFinite(value) || value < 0)return null;
  const formatted=new Intl.NumberFormat(undefined,{style:"currency",currency,maximumFractionDigits:value<1?4:2}).format(value);
  return <span className="quorail-approx" title={`Approx. for planning only. Rate checked ${new Date(rates.asOf).toLocaleString()}.`}>
    ≈ {formatted} <span>· Approx. for planning only{stale?" · Cached rate":""}</span>
  </span>;
}
export function WalletCurrencyControls(){
 const {currency,enabled,setCurrency,setEnabled,rates}=useLocalCurrency();
 return <div className="wallet-currency-controls">
 <div className="wallet-currency-select"><label htmlFor="wallet-local-currency">DISPLAY CURRENCY</label><select id="wallet-local-currency" value={currency} disabled={!enabled} onChange={e=>setCurrency(e.target.value as Code)}>{codes.map(code=><option key={code} value={code}>{code}</option>)}</select></div>
 <label className="wallet-currency-check"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Show local equivalent</label>
 <small>{enabled ? rates && validRates(rates) ? `Approx. for planning only · Rate checked ${new Date(rates.asOf).toLocaleString()}` : "Rate unavailable. No estimate shown." : "Local equivalents are off."}</small>
 </div>;
}
export function LocalCurrencySetting(){
 const {currency,enabled,setCurrency,setEnabled,rates,stale}=useLocalCurrency();
 return <div className="quorail-local-settings"><div><strong>Local currency display</strong><small>Approx. for planning only. No fiat payments or conversion.</small></div>
 <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Show estimates</label>
 <label>Currency <select value={currency} disabled={!enabled} onChange={e=>setCurrency(e.target.value as Code)}>{codes.map(code=><option key={code} value={code}>{code}</option>)}</select></label>
 <small>{rates?`Rates checked ${new Date(rates.asOf).toLocaleString()}${stale?" · cached":""}`:"Conversion estimates unavailable. Payments still work."}</small></div>;
}
