# Quorail V6 mobile experience patch

- Corrected the Overview/Payments/Activity JSX conditional that displayed `) : (` as text on mobile.
- The USDT transfer module now appears on Payments rather than Overview.
- Redesigned the USDT module with compact layout, readable inputs, and wallet/status information.
- Added a NIM + Polygon USDT explanation on the landing page.
- When supported by an injected EVM wallet, Quorail requests Polygon network switching via `wallet_switchEthereumChain`. The wallet may ask for user approval; unsupported wallets show a clear message. This does not guarantee that Nimiq Pay exposes an EVM provider inside its Mini App browser.
- The existing NIM payment and reserve model remains NIM-only. Polygon USDT transfers remain separate; do not market the app as supporting USDT commitments or shared boards yet.
- Do not enter a `.nim` or NQ address for Polygon USDT. No verified cross-chain identity mapping exists in this code.

## Validation

The modified TSX files were parsed with TypeScript and had zero syntax diagnostics. `npm ci` timed out in this environment, so a complete Next.js production build and live wallet transaction could not be verified. Run `npm ci && npm run build && npm test` locally before pushing.
