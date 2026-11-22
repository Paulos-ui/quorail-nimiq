import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "../app/api/rates/route";

test("rate route rejects stale CoinGecko NIM and malformed primary FX and uses valid fallbacks", async (t) => {
  const now = new Date();
  const unix = Math.floor(+now / 1000);
  const fixture = (url: string) => {
    if (url.includes("coingecko")) return {
      nimiq: { usd: 0.028, last_updated_at: 1577332800 },
      tether: { usd: 0.998, last_updated_at: unix },
    };
    if (url.includes("coinpaprika")) return { id: "nim-nimiq", last_updated: now.toISOString(), quotes: { USD: { price: 0.0001692 } } };
    if (url.includes("er-api")) return { result: "success", base_code: "EUR", time_last_update_unix: unix, rates: {} };
    return { date: now.toISOString().slice(0, 10), usd: { usd: 1, ngn: 1450, eur: 0.9, gbp: 0.8, cad: 1.35, inr: 85 } };
  };
  t.mock.method(globalThis, "fetch", async (url: string) => Response.json(fixture(url)));
  const response = await GET();
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.market.NIM.value, 0.0001692);
  assert.equal(data.market.USDT.value, 0.998);
  assert.equal(data.fx.rates.CAD, 1.35);
  assert.equal(data.fx.source, "Currency API");
});

test("rate route keeps valid NIM USD when USDT and FX are unavailable", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string) => url.includes("coinpaprika")
    ? Response.json({ id: "nim-nimiq", last_updated: new Date().toISOString(), quotes: { USD: { price: 0.0001692 } } })
    : new Response(null, { status: 429 }));
  const response = await GET();
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.market.NIM.value, 0.0001692);
  assert.equal(data.market.USDT, undefined);
  assert.equal(data.fx, null);
});
