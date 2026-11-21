# V6.2 USDT balance connection UI

The USDT balance card now has a prominent connection button, a loading state, clear connected/unconnected states, a Polygon account summary, and a refresh action. It never displays a fabricated 0 USDT when the balance read fails. On a valid Polygon EVM provider, the balance is fetched via `eth_call` on the configured USDT contract. The card also refreshes when the wallet account/network changes or after a verified transfer.

## Not yet verified
- No real wallet connection or transfer was possible in this environment.
- Nimiq Pay's embedded browser may not expose the EVM provider required by the current Polygon implementation.
- The exact asset/token contract displayed by Nimiq Pay must be compared with the configured Polygon USDT contract before promising matching balances.
- A confirmed USDT payment requires checking the receipt on-chain and matching sender, recipient, contract, and amount. The existing payment module performs these checks but has not been live-tested.

## Local checks
`npm ci && npm run typecheck && npm test && npm run build`

Test with a small amount first. Do not deploy as fully verified payment functionality without a successful end-to-end transfer and receipt check.
