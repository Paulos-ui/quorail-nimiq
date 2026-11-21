export type CurrencyRates = { nimUsd: number; usdtUsd: number; usdToLocal: Record<string, number>; asOf: string; source?: string };
const fxBounds: Record<string, [number, number]> = {
  USD: [0.999, 1.001], NGN: [100, 10000], EUR: [0.5, 2], GBP: [0.4, 2], INR: [40, 200], CAD: [0.8, 3],
};
/** Fail closed on corrupt upstream data or stale storage. This is a sanity guard, not a substitute for price discovery. */
export function validateCurrencyRates(data: unknown, now = Date.now()): data is CurrencyRates {
  if (!data || typeof data !== 'object') return false;
  const r = data as Partial<CurrencyRates>;
  // NIM trades at a small fraction of USD. Values such as $2,820/NIM are invalid.
  if (typeof r.nimUsd !== 'number' || !Number.isFinite(r.nimUsd) || r.nimUsd <= 0 || r.nimUsd >= 0.1) return false;
  if (typeof r.usdtUsd !== 'number' || !Number.isFinite(r.usdtUsd) || r.usdtUsd < 0.8 || r.usdtUsd > 1.2) return false;
  const t = Date.parse(r.asOf || '');
  if (!Number.isFinite(t) || t > now + 300000 || now - t > 4 * 3600000) return false;
  if (!r.usdToLocal || typeof r.usdToLocal !== 'object') return false;
  for (const [code, rate] of Object.entries(r.usdToLocal)) {
    const bounds = fxBounds[code];
    if (!bounds || typeof rate !== 'number' || !Number.isFinite(rate) || rate < bounds[0] || rate > bounds[1]) return false;
  }
  return r.usdToLocal.USD === 1;
}
