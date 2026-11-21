# Quorail V6 consolidated payment interface

## Implemented
- The Add payment dialog offers a NIM / USDT selector for new payments.
- NIM retains the existing commitment, due date, reserve and Nimiq Pay flow.
- USDT opens the existing Polygon transaction module within the same payment dialog.
- The Payments workspace offers a NIM / USDT selector rather than displaying both payment interfaces together.
- Mobile sizing, scrolling and visual hierarchy were adjusted.
- Existing NIM records and balances are not mixed with USDT.

## Limitations
- USDT transfers are not yet recorded as Quorail commitments or in the unified receipt history. The Polygon module tracks a pending transaction in localStorage.
- USDT requires an EIP-1193 compatible EVM provider. The Nimiq Pay embedded environment may not expose one.
- USDT needs a Polygon `0x` recipient. `.nim` resolution only applies to NIM.
- The NIM Safe-to-Pay reserve does not account for USDT.
- No actual USDT transaction has been performed as part of this change.
- Do not claim this is a fully verified Nimiq Pay USDT integration.

## Validation
- TypeScript TSX transpilation syntax checks passed for the edited payment components.
- `npm ci` timed out in the build environment.
- `npm run typecheck` could not complete due to missing dependency type definitions.
- Run `npm ci && npm run typecheck && npm test && npm run build` locally before pushing.
