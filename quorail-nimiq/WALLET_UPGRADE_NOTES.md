# Quorail wallet card integration

- One wallet card switches between NIM and Polygon USDT.
- Preferred local currency selector and opt-in control are embedded inside the same card in both asset states.
- NIM and USDT balances remain the primary units. Local equivalents are display-only.
- Rates are fetched from `/api/rates`, sourced from CoinGecko and ExchangeRate-API, and rejected if invalid or older than four hours.
- A failed or stale quote does not fabricate a local value or prevent payment.
- User currency preference persists across visits.
- Polygon USDT needs a compatible EVM wallet and wallet approval. The real transfer path must be tested with a small payment on the intended network before announcing production readiness.

## Verification

Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build` locally. Check NIM and USDT states, currency selection, wallet connection, transaction confirmation, and mobile layout. No production transaction has been performed by this package creator.
