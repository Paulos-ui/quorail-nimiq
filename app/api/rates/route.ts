import { NextResponse } from "next/server";
export const revalidate = 3600;
const currencies = ["USD", "NGN", "EUR", "GBP", "INR", "CAD"] as const;
export async function GET() {
  try {
    const [coin, fx] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=nimiq,tether&vs_currencies=usd", { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6500) }),
      fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6500) }),
    ]);
    if (!coin.ok || !fx.ok) throw new Error("Rates unavailable");
    const prices = await coin.json();
    const exchange = await fx.json();
    const nimUsd = Number(prices?.nimiq?.usd);
    const usdtUsd = Number(prices?.tether?.usd);
    if (!(nimUsd > 0 && nimUsd < 1) || !(usdtUsd >= 0.8 && usdtUsd <= 1.2) || exchange?.result !== "success") throw new Error("Invalid rates");
    const rates: Record<string, number> = {};
    for (const code of currencies) {
      const rate = code === "USD" ? 1 : Number(exchange.rates?.[code]);
      if (rate > 0 && Number.isFinite(rate)) rates[code] = rate;
    }
    return NextResponse.json({ nimUsd, usdtUsd, usdToLocal: rates, asOf: new Date().toISOString(), approximate: true, source: "CoinGecko / ExchangeRate-API" }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } });
  } catch {
    return NextResponse.json({ error: "Conversion rates temporarily unavailable" }, { status: 503 });
  }
}
