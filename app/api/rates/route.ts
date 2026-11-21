import { NextResponse } from "next/server";
import { validateCurrencyRates } from "@/lib/validateCurrencyRates";
export const dynamic = "force-dynamic";
const currencies = ["USD", "NGN", "EUR", "GBP", "INR", "CAD"] as const;
const timeout = 5500;
async function getJson(url: string) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(`Market provider ${response.status}`);
  return response.json();
}
type TimedQuote = { value: number; timestamp: number; source: string };
const fresh = (timestamp: number) => Number.isFinite(timestamp) && timestamp <= Date.now() + 300000 && Date.now() - timestamp < 4 * 3600000;
async function nimQuote(): Promise<TimedQuote> {
  const candidates = await Promise.allSettled([
    (async (): Promise<TimedQuote> => {
      const data = await getJson("https://api.coingecko.com/api/v3/simple/price?ids=nimiq&vs_currencies=usd&include_last_updated_at=true");
      return { value: Number(data?.nimiq?.usd), timestamp: Number(data?.nimiq?.last_updated_at) * 1000, source: "CoinGecko" };
    })(),
    (async (): Promise<TimedQuote> => {
      const data = await getJson("https://api.coinpaprika.com/v1/tickers/nim-nimiq?quotes=USD");
      return { value: Number(data?.quotes?.USD?.price), timestamp: Date.parse(data?.last_updated || ""), source: "CoinPaprika" };
    })(),
  ]);
  const quotes = candidates.flatMap(result => result.status === "fulfilled" ? [result.value] : [])
    .filter(q => Number.isFinite(q.value) && q.value > 0 && q.value < 0.1 && fresh(q.timestamp));
  if (!quotes.length) throw new Error("No fresh verified NIM/USD quote");
  if (quotes.length > 1) {
    const [a, b] = quotes;
    if (Math.abs(a.value - b.value) / Math.min(a.value, b.value) > 0.2) throw new Error("NIM market sources disagree");
  }
  return quotes[0];
}
async function usdtQuote(): Promise<TimedQuote> {
  const data = await getJson("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd&include_last_updated_at=true");
  const quote = { value: Number(data?.tether?.usd), timestamp: Number(data?.tether?.last_updated_at) * 1000, source: "CoinGecko USDT/USD" };
  if (!Number.isFinite(quote.value) || quote.value < 0.8 || quote.value > 1.2 || !fresh(quote.timestamp)) throw new Error("Fresh USDT quote unavailable");
  return quote;
}
async function fxQuotes(): Promise<{ rates: Record<string, number>; timestamp: number; source: string }> {
  try {
    const data = await getJson("https://open.er-api.com/v6/latest/USD");
    const timestamp = Number(data?.time_last_update_unix) * 1000;
    if (data?.result === "success" && Number.isFinite(timestamp) && Date.now() - timestamp < 4 * 86400000 && timestamp <= Date.now() + 300000) {
      return { rates: data.rates, timestamp, source: "ExchangeRate-API" };
    }
  } catch { /* Try independent FX provider. */ }
  const data = await getJson("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json");
  const timestamp = Date.parse(data?.date || "");
  if (!data?.usd || !Number.isFinite(timestamp) || Date.now() - timestamp > 4 * 86400000 || timestamp > Date.now() + 86400000) throw new Error("Fresh FX quotes unavailable");
  const rates = Object.fromEntries(Object.entries(data.usd)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0)
    .map(([key, value]) => [key.toUpperCase(), value])) as Record<string, number>;
  return { rates, timestamp, source: "Currency API" };
}
export async function GET() {
  try {
    const [nimQuoteData, usdtQuoteData, fxQuoteData] = await Promise.all([nimQuote(), usdtQuote(), fxQuotes()]);
    const nimUsd = nimQuoteData.value;
    const fx = fxQuoteData.rates;
    const usdToLocal: Record<string, number> = { USD: 1 };
    for (const currency of currencies) {
      const rate = currency === "USD" ? 1 : Number(fx[currency]);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error(`Missing FX rate ${currency}`);
      usdToLocal[currency] = rate;
    }
    // USDT uses a fresh market quote, never a hardcoded $1 assumption.
    const payload = { nimUsd, usdtUsd: usdtQuoteData.value, usdToLocal, asOf: new Date().toISOString(), source: `${nimQuoteData.source} NIM/USD; ${usdtQuoteData.source}; ${fxQuoteData.source} USD/FX`, marketAsOf: new Date(nimQuoteData.timestamp).toISOString(), fxAsOf: new Date(fxQuoteData.timestamp).toISOString() };
    if (!validateCurrencyRates(payload)) throw new Error("Invalid market data");
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: "Validated conversion rates unavailable", detail: error instanceof Error ? error.message : "Unknown error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
