# Quorail V6 wallet balance update

- The existing overview balance card now switches between NIM and USDT.
- NIM displays existing balance, obligations, reserve, and planning horizon.
- USDT reads actual Polygon token balance from an available EIP-1193 wallet provider; no fabricated zero or combined balances.
- USDT prompts to connect when a compatible provider/account is not available. Network switch requires wallet approval.
- Confirmed USDT transfers show a success message only after checking the Polygon receipt and matching sender, recipient, amount, and token.
- The overview card refreshes when a USDT payment is verified.

Limitations: The connected Nimiq Pay Mini App browser may not expose an EVM provider. USDT commitments and reserves are not yet implemented. USDT receipts are currently linked to PolygonScan through the payment module. Full typecheck/build cannot be confirmed in this environment because npm dependencies are incomplete.
