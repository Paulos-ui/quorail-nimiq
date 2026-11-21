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
async function nimQuote(): Promise<number> {
  try {
    const data = await getJson("https://api.coingecko.com/api/v3/simple/price?ids=nimiq&vs_currencies=usd&include_last_updated_at=true");
    const value = Number(data?.nimiq?.usd);
    const timestamp = Number(data?.nimiq?.last_updated_at);
    if (value > 0 && value < 0.1 && timestamp > 0 && Math.abs(Date.now() / 1000 - timestamp) < 14400) return value;
  } catch { /* Try independent quote provider. */ }
  const data = await getJson("https://api.coinpaprika.com/v1/tickers/nim-nimiq?quotes=USD");
  const value = Number(data?.quotes?.USD?.price);
  const timestamp = Date.parse(data?.last_updated || "");
  if (!(value > 0 && value < 0.1) || !Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 14400000) throw new Error("No validated NIM quote");
  return value;
}
async function fxQuotes(): Promise<Record<string, number>> {
  try {
    const data = await getJson("https://open.er-api.com/v6/latest/USD");
    if (data?.result === "success") return data.rates;
  } catch { /* Try alternative FX provider. */ }
  const data = await getJson("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json");
  if (!data?.usd) throw new Error("FX quotes unavailable");
  return Object.fromEntries(
    Object.entries(data.usd)
      .filter((entry): entry is [string, number] =>
        typeof entry[1] === "number" &&
        Number.isFinite(entry[1]) &&
        entry[1] > 0
      )
      .map(([key, value]) => [key.toUpperCase(), value])
  ) as Record<string, number>;
}
export async function GET() {
  try {
    const [nimUsd, fx] = await Promise.all([nimQuote(), fxQuotes()]);
    const usdToLocal: Record<string, number> = { USD: 1 };
    for (const currency of currencies) {
      const rate = currency === "USD" ? 1 : Number(fx[currency]);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error(`Missing FX rate ${currency}`);
      usdToLocal[currency] = rate;
    }
    // USDT is a planning approximation, not a promise of a guaranteed $1 redemption.
    const payload = { nimUsd, usdtUsd: 1, usdToLocal, asOf: new Date().toISOString(), source: "Validated NIM market and FX providers" };
    if (!validateCurrencyRates(payload)) throw new Error("Invalid market data");
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: "Validated conversion rates unavailable", detail: error instanceof Error ? error.message : "Unknown error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
