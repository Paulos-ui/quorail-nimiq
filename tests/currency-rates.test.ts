import { test } from "node:test";
import assert from "node:assert/strict";
import { convertLocalAmount, formatLocalAmount, parseFx, selectedRate, validateCurrencyRates, type CurrencyRates, type CurrencyCode } from "../lib/validateCurrencyRates";

const now = Date.parse("2026-11-22T00:00:00Z");
const rates: CurrencyRates = {
  asOf: now,
  market: {
    NIM: { value: 0.0001692, timestamp: now, source: "fixture" },
    USDT: { value: 0.996, timestamp: now, source: "fixture" },
  },
  fx: { rates: { USD: 1, NGN: 1450, EUR: 0.9, GBP: 0.8, CAD: 1.35, INR: 85 }, timestamp: now, source: "fixture" },
};
const expected: Record<CurrencyCode, number> = {
  USD: 1.6707835044, NGN: 2422.63608138, EUR: 1.50370515396,
  GBP: 1.33662680352, CAD: 2.25555773094, INR: 142.016597874,
};

test("converts Luna once and applies a single NIM/USD quote to each currency", () => {
  assert.ok(validateCurrencyRates(rates, now));
  for (const [code, value] of Object.entries(expected)) {
    const rate = selectedRate(rates, "NIM", code as CurrencyCode, now);
    assert.ok(rate);
    assert.ok(Math.abs(convertLocalAmount(987_460_700, "NIM", rate)! - value) < 1e-9, code);
  }
  assert.equal(formatLocalAmount(expected.USD, "USD", "en-US"), "$1.67");
  assert.equal(formatLocalAmount(0.001268, "USD", "en-US"), "$0.0013");
});

test("USDT uses its quoted price and keeps the selected currency", () => {
  const rate = selectedRate(rates, "USDT", "CAD", now);
  assert.ok(rate);
  assert.equal(formatLocalAmount(convertLocalAmount(12.345678, "USDT", rate)!, "CAD", "en-CA"), "$16.60");
  assert.equal(convertLocalAmount(0, "USDT", rate), 0);
  assert.equal(convertLocalAmount(-1, "USDT", rate), null);
});

test("rejects invalid market payloads and old cache formats", () => {
  for (const value of ["0.0001692", true, 0, -1, NaN, Infinity, 2820]) {
    assert.equal(validateCurrencyRates({ ...rates, market: { NIM: { ...rates.market.NIM, value } } }, now), false);
  }
  assert.equal(validateCurrencyRates({ nimUsd: 0.0001692, asOf: new Date(now).toISOString() }, now), false);
  assert.equal(validateCurrencyRates({ ...rates, asOf: now + 301_000 }, now), false);
  assert.equal(validateCurrencyRates({ ...rates, market: { NIM: { ...rates.market.NIM, timestamp: now - 4 * 3600000 } } }, now), false);
});

test("rejects missing, inverted, string, and non-USD-base FX values", () => {
  const valid = rates.fx!.rates;
  for (const fx of [{ USD: 1 }, { ...valid, USD: 0.999 }, { ...valid, NGN: 0.0007 }, { ...valid, GBP: "0.8" }]) {
    assert.equal(parseFx(fx), null);
  }
});

test("expired or unavailable quotes affect only the relevant conversion while open", () => {
  assert.equal(selectedRate(rates, "NIM", "USD", now + 4 * 3600000), null);
  const partial: CurrencyRates = { ...rates, market: { NIM: rates.market.NIM }, fx: null };
  assert.ok(validateCurrencyRates(partial, now));
  assert.ok(selectedRate(partial, "NIM", "USD", now));
  assert.equal(selectedRate(partial, "NIM", "NGN", now), null);
  assert.equal(selectedRate(partial, "USDT", "USD", now), null);
  const expiredFx = { ...rates, fx: { ...rates.fx!, timestamp: now - 2 * 86400000 } };
  assert.equal(selectedRate(expiredFx, "NIM", "CAD", now), null);
  assert.ok(selectedRate(expiredFx, "NIM", "USD", now));
});

test("signed forecast deficits use the same fresh quote and precision as positive forecasts", () => {
  for (const code of Object.keys(expected) as CurrencyCode[]) {
    const rate = selectedRate(rates, "NIM", code, now)!;
    const positive = convertLocalAmount(1205*100000, "NIM", rate)!;
    assert.equal(convertLocalAmount(-1205*100000, "NIM", rate, true), -positive);
    assert.equal(convertLocalAmount(-1205*100000, "NIM", rate), null);
  }
  assert.equal(formatLocalAmount(-123.4567,"USD","en-US"),"-$123.46");
});
