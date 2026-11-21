# Three-tier release status

## Tier 1

- Reserve signal: visible across private workspace tabs, sticky while scrolling, and included in individual/shared payment previews. Exact remaining balance, commitments and buffer are shown. The reserve remains a target, not a locked or spent balance.
- Payment path: native approval, attached hash and automatic receipt checks are implemented. The actual transfer and recording require your Nimiq Pay device. No guarantee that network confirmation finishes within 60 seconds.
- Recurrence: weekly/monthly, next occurrence after verified confirmation, 30/60/90 projections and example rent costs are implemented.
- Shared settlement: invite snapshots, claims, native payments, public references, automatic matching receipt checks and partial/full totals are implemented. V3.2 adds previews and rotates checks so one stuck receipt cannot monopolize polling. Requires configured Redis and live device acceptance.
- Collection: exact shares and verification are implemented. Incoming contributions never falsely mark the outgoing bill as paid.

## Tier 2

- Focused AI: affordability, 14-day delay and first reserve-breach group. Figures are computed locally and visible before submitting questions. Same-date bills are grouped, not arbitrarily ranked. Requires configured Anthropic and Redis for responses.
- Examples: freelancer expenses, shared team costs, personal rent/groceries. Unreceived invoices are not spendable balance. No simulated receipts or automated demo payments.
- Wallet comparison: landing-page explanation with explicitly illustrative numbers.
- History and export: linked receipts, full JSON backup and verified-record CSV. CSV planned fees are labeled separately from payment amounts. Local records can be modified; the exported file is not a cryptographic proof.

## Tier 3

- V4 adds a cached read-only offline companion with local record selection and JSON export. Password-protected backups and encrypted imports are available. Browser storage remains unencrypted. Exports track download requests, not confirmed file saves.
- V4 adds Connect Four against a tactical bot and retains chess, tic-tac-toe and Money Moves. Keyboard focus, reduced-motion support and mobile controls are improved. No NIM rewards or NFT minting are implemented. NFT work remains deliberately out of scope.

## Before submission

Run the native wallet checklist in TESTING.md. Record the actual payment path using DEMO_SCRIPT.md. Check real shared receipts from two devices and an actual Anthropic response. Do not claim these live external tests were completed by the automated test suite. Keep the existing Vercel domain and export your current plan before upgrading.
