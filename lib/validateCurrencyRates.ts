import { LUNA } from "./finance";

const fxBounds = {
  USD: [1, 1], NGN: [100, 10000], EUR: [0.5, 2], GBP: [0.4, 2], INR: [40, 200], CAD: [0.8, 3],
};
export type CurrencyCode = keyof typeof fxBounds;
export const currencyCodes = Object.keys(fxBounds) as CurrencyCode[];
export type Asset = "NIM" | "USDT";
export type TimedQuote = { value: number; timestamp: number; source: string };
export type CurrencyRates = {
  market: Partial<Record<Asset, TimedQuote>>;
  fx: { rates: Record<CurrencyCode, number>; timestamp: number; source: string } | null;
  asOf: number;
};
export const marketMaxAge = 4 * 3600000;
const fxMaxAge = 2 * 86400000;

export function fresh(timestamp: unknown, maxAge: number, now = Date.now()): timestamp is number {
  return typeof timestamp === "number" && Number.isSafeInteger(timestamp) &&
    timestamp <= now + 300000 && now - timestamp < maxAge;
}

export function validMarket(asset: Asset, quote: TimedQuote | undefined, now = Date.now()) {
  if (!quote || !fresh(quote.timestamp, marketMaxAge, now) ||
    typeof quote.value !== "number" || !Number.isFinite(quote.value) || typeof quote.source !== "string") return false;
  return asset === "NIM" ? quote.value > 0 && quote.value < 0.1 : quote.value >= 0.5 && quote.value <= 1.5;
}

export function parseFx(value: unknown): Record<CurrencyCode, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const rates = value as Record<string, unknown>;
  const result = {} as Record<CurrencyCode, number>;
  for (const code of currencyCodes) {
    const rate = rates[code];
    const [min, max] = fxBounds[code];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate < min || rate > max) return null;
    result[code] = rate;
  }
  return result;
}

export function validateCurrencyRates(data: unknown, now = Date.now()): data is CurrencyRates {
  if (!data || typeof data !== "object") return false;
  const r = data as CurrencyRates;
  if (!fresh(r.asOf, marketMaxAge, now) || !r.market || typeof r.market !== "object" || Array.isArray(r.market)) return false;
  if (r.fx !== null && (!r.fx || typeof r.fx.source !== "string" ||
    !fresh(r.fx.timestamp, fxMaxAge, now) || !parseFx(r.fx.rates))) return false;
  const assets = Object.keys(r.market);
  return assets.length > 0 && assets.every(asset =>
    (asset === "NIM" || asset === "USDT") && validMarket(asset, r.market[asset], now));
}

export function selectedRate(rates: CurrencyRates | null, asset: Asset, currency: CurrencyCode, now = Date.now()) {
  const quote = rates?.market[asset];
  if (!rates || !quote || !fresh(rates.asOf, marketMaxAge, now) || !validMarket(asset, quote, now)) return null;
  if (currency === "USD") return { quote, fx: 1 };
  const fx = rates.fx;
  if (!fx || !fresh(fx.timestamp, fxMaxAge, now)) return null;
  const rate = fx.rates[currency];
  return Number.isFinite(rate) && rate > 0 ? { quote, fx: rate } : null;
}

/** NIM amounts come from the wallet and plan in Luna. USDT amounts are whole tokens. */
export function convertLocalAmount(amount: number, asset: Asset, rate: NonNullable<ReturnType<typeof selectedRate>>, signed = false) {
  const value = (asset === "NIM" ? amount / LUNA : amount) * rate.quote.value * rate.fx;
  return Number.isFinite(value) && (signed || amount >= 0) ? value : null;
}

export function formatLocalAmount(value: number, currency: CurrencyCode, locale?: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: Math.abs(value) < 1 ? 4 : 2 }).format(value);
}
