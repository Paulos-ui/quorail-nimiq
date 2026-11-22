import { NextResponse } from "next/server";
import { fresh, parseFx, validMarket, type Asset, type CurrencyRates, type TimedQuote } from "@/lib/validateCurrencyRates";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

async function getJson(url: string) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5500) });
  if (!response.ok) throw new Error(`Market provider ${response.status}`);
  return response.json();
}

const unixMs = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) ? value * 1000 : NaN;
const dateMs = (value: unknown) => typeof value === "string" ? Date.parse(value) : NaN;

async function coinGecko() {
  const data = await getJson("https://api.coingecko.com/api/v3/simple/price?ids=nimiq,tether&vs_currencies=usd&include_last_updated_at=true");
  const quote = (id: string): TimedQuote => ({ value: data?.[id]?.usd, timestamp: unixMs(data?.[id]?.last_updated_at), source: "CoinGecko" });
  return { NIM: quote("nimiq"), USDT: quote("tether") };
}

async function coinPaprika(): Promise<TimedQuote> {
  const data = await getJson("https://api.coinpaprika.com/v1/tickers/nim-nimiq?quotes=USD");
  if (data?.id !== "nim-nimiq") throw new Error("Unexpected CoinPaprika ticker");
  return { value: data?.quotes?.USD?.price, timestamp: dateMs(data?.last_updated), source: "CoinPaprika" };
}

async function fxQuotes(): Promise<CurrencyRates["fx"]> {
  try {
    const data = await getJson("https://open.er-api.com/v6/latest/USD");
    const timestamp = unixMs(data?.time_last_update_unix);
    const rates = parseFx(data?.rates);
    if (data?.result === "success" && data?.base_code === "USD" && rates && fresh(timestamp, 2 * 86400000)) {
      return { rates, timestamp, source: "ExchangeRate-API" };
    }
  } catch { /* Try the independent USD-base FX feed. */ }
  const data = await getJson("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json");
  const timestamp = typeof data?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? dateMs(data.date) : NaN;
  const rates = data?.usd && typeof data.usd === "object" && parseFx(
    Object.fromEntries(Object.entries(data.usd).map(([code, rate]) => [code.toUpperCase(), rate])),
  );
  return rates && fresh(timestamp, 2 * 86400000) ? { rates, timestamp, source: "Currency API" } : null;
}

export async function GET() {
  const [gecko, paprika, fxResult] = await Promise.allSettled([coinGecko(), coinPaprika(), fxQuotes()]);
  const market: Partial<Record<Asset, TimedQuote>> = {};
  const primary = gecko.status === "fulfilled" ? gecko.value : undefined;
  const nim = validMarket("NIM", primary?.NIM) ? primary?.NIM : undefined;
  const fallback = paprika.status === "fulfilled" && validMarket("NIM", paprika.value) ? paprika.value : undefined;
  if (!(nim && fallback && Math.abs(nim.value - fallback.value) / Math.min(nim.value, fallback.value) > 0.2)) {
    const quote = nim ?? fallback;
    if (quote) market.NIM = quote;
  }
  if (primary && validMarket("USDT", primary.USDT)) market.USDT = primary.USDT;
  if (!market.NIM && !market.USDT) return NextResponse.json({ error: "Validated conversion rates unavailable" }, { status: 503, headers });
  const payload: CurrencyRates = { market, fx: fxResult.status === "fulfilled" ? fxResult.value : null, asOf: Date.now() };
  return NextResponse.json(payload, { headers });
}
