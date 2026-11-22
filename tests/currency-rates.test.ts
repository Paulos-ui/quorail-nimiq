import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { validateCurrencyRates } from '../lib/validateCurrencyRates';
const now = Date.now();
const base = { nimUsd: 0.001, usdtUsd: 1, usdToLocal: { USD: 1, NGN: 1400, GBP: 0.8 }, asOf: new Date(now).toISOString() };
test('accepts plausible recent quotes', () => assert.equal(validateCurrencyRates(base, now), true));
test('rejects million-dollar conversion bug', () => assert.equal(validateCurrencyRates({ ...base, nimUsd: 2820 }, now), false));
test('rejects corrupt FX quotes', () => assert.equal(validateCurrencyRates({ ...base, usdToLocal: { USD: 1, NGN: 1000000 } }, now), false));
test('rejects stale quotes', () => assert.equal(validateCurrencyRates({ ...base, asOf: new Date(now - 5 * 3600000).toISOString() }, now), false));
