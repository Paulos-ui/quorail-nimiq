# Quorail V6: Polygon USDT payment path

This is an initial implementation for **Polygon PoS USDT**, contract `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`, 6 decimals, chain ID 137. Verify this token with PolygonScan and the wallet before any real payment. It is a Polygon token, not NIM and not automatically accepted on other networks. Some interfaces now label it USDT0.

## Included

- A separate Polygon USDT panel inside the Payments view.
- Explicit EVM wallet connection via `window.ethereum`, network check (137), USDT balance query, exact-decimal amount parsing, recipient address validation, native wallet approval of ERC-20 transfer.
- Pending transaction hash saved in browser local storage to reduce accidental repeat payments after reload.
- Receipt verification checks successful transaction status, contract, sender, recipient, exact transfer calldata and ERC-20 Transfer log.
- Existing NIM payment path and NIM reserves unchanged.

## Limitations before production

- **Not yet verified inside Nimiq Pay's actual mobile WebView**. If `window.ethereum` is not injected, the panel will report an unsupported provider. The wallet's ERC-20 signing and fee sponsorship behavior need device testing.
- USDT transfers are **not** added to NIM-denominated commitments, forecasts, shared boards, or exported NIM receipts. Do not present them as integrated until those models are updated to be multi-asset.
- `.nim` names are NIM identities. They cannot be used as Polygon addresses without a separately verified mapping.
- No production wallet-to-wallet test has been executed here. Run the full Next.js build and tests on your PC and use a small payment first.
- Wallet or network switching during a pending payment requires reconnecting to the original sender; preserve the transaction hash.
- Some EVM wallets require POL for transaction fees. Do not promise gas-free payments until verified in the target wallet.

## Testing

`npm ci && npm run typecheck && npm test && npm run build`

Open Payments, connect an EVM wallet on Polygon, verify USDT balance, send a tiny amount to a wallet you control, then use Verify receipt. Check the actual token contract, transfer amount and destination on PolygonScan. If the wallet does not expose EIP-1193 methods, stop and adapt to its supported API instead of guessing.
