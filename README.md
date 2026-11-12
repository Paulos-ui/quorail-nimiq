# Quorail for Nimiq Pay

**See what a payment leaves behind.**

Quorail helps independent workers and small teams plan NIM commitments, understand the remaining buffer, approve payments in Nimiq Pay and keep matching receipts. Built by Jayking: [GitHub](https://github.com/paulos-ui) · [X](https://x.com/__official__1).

## Version 4.3.1: visible payment receipts

Confirmed payments now open a Quorail receipt with the verified amount, fee, sender, recipient, network, transaction hash and first verification time. Download a PNG image or an HTML printable receipt, which can be opened in a browser and printed to PDF. Receipts include private payment details; share them intentionally. A receipt is a record of an RPC-verified transaction, not a tax invoice. Rechecking preserves the first verification time. Confirmed payments no longer display a hypothetical second deduction from the current balance. Existing confirmed records work without another payment.

## Version 4.3: native payment balance and broader localization

This is a complete source release, including the previous QR setup, recurring plans, shared boards, AI, games and backups.

- Read the current Nimiq Pay HTLC balance from the second shared address, instead of the usually empty stable wallet address. Keep plans under the stable wallet identity. Native balance reads no longer depend on a separate public RPC consensus check.
- Re-read addresses around balance queries and retry contract rotation. Listen for `accountsChanged` and refresh when the app returns to the foreground. Never sum pending incoming funds into the spendable balance.
- Persist the expected payment contract sender before opening wallet approval. Check that sender, recipient, amount, execution and network when verifying the receipt. A transaction hash alone is not confirmation.
- Compact navigation controls with an animated sun/moon button, a language menu, and system-theme support. Official store QR setup remains included.
- Spanish, German and French catalogs now cover page copy, guide, dialogs, known errors, status labels and the offline companion. AI receives a validated response language. Addresses, hashes, user-authored content and unknown external diagnostic messages are preserved. Native wallet/browser dialogs are controlled by their own language settings.

See [V4.3 release and live acceptance checks](docs/V4_3_RELEASE.md). Tests use simulated provider responses; no real wallet transfer was performed during packaging.

## Previous Version 4.1 mobile payment fixes

- Historical V4.1 behavior, superseded in V4.3: network consensus was checked before displaying a native balance. Lookup errors and timeouts show unavailable rather than zero. A successful zero response remains zero.
- Retry balance, selected account/network and last successful check are visible. V4.3 reads the wallet payment contract, preserving the stable account for saved plans.
- Validation errors appear immediately above the add-payment button on mobile. Ambiguous fees such as 05 are rejected with explicit examples instead of silently interpreted.
- Payment previews explain disabled states, including missing acknowledgement, unavailable balance, reserve breach and unresolved prior payment.
- Read-only calls have bounded waits. Transaction submission is never automatically retried or unlocked on a timeout.
- Nimiq Pay server outages still require the wallet connection to recover. No live funds were sent during development.

## Previous Version 4.0

This full release includes all V3.2 and V3.2.1 changes, including Vercel Redis credential aliases and clearer AI setup errors.

- Read-only offline companion: choose a plan saved in this browser, inspect saved commitments and export a local JSON backup. No cached live balance or payment capability. Load the site online once and allow the service worker to activate first.
- Optional encrypted JSON backups using browser AES-GCM with a password-derived key. Restore through Planning settings with the original wallet/network. The password never goes to Quorail's server. Browser storage itself remains unencrypted.
- Connect Four against a local tactical bot, alongside chess, tic-tac-toe and Money Moves. No stakes or payouts.
- Mobile game controls, stronger keyboard focus states and reduced-motion support.
- Complete deployment and native acceptance instructions in START_HERE.md and docs/DEPLOYMENT.md.

NFT minting remains out of scope. This is a Pay release; no mint, rewards or blockchain recovery is implied. See docs/V4_RELEASE.md for verification and limits.

## Previous Version 3.2

New: shared-payment reserve previews with a fresh pre-send balance check; rotating shared receipt checks; due-date risk review with focused AI explanation; verified receipt CSV export; an offline notice; and a full-backup card. Private-plan reserve signals stay visible while scrolling. CSV exports protect spreadsheet formula cells and include only confirmed records. Example records and user imports are not independent proof of payment; verification still relies on the configured RPC.

## Previous Version 3.1

New: a floating landing-page Quorail AI robot; reserve signals across workspace tabs; freelancer, team and personal examples; a local two-week delay comparison; and payment-specific AI prompts with visible numbers. The landing assistant does not load private plans. A recording outline is included in `docs/DEMO_SCRIPT.md`; no live payment video is bundled.

## Core functionality

- Payment preview with covered, tight and reserve-at-risk signals. Adjust the reserve and see the calculation change immediately.
- Real native wallet execution, transaction hashes linked to commitments and automatic receipt checks while the workspace is visible.
- One-time, weekly and monthly commitments with custom due dates and 30/60/90-day projections. Confirming a recurring payment creates its next occurrence once. No automatic debits.
- Shareable collection requests with exact split amounts, unique public transaction references and partial/full collection totals.
- Shared team snapshots with responsibility labels and live receipt statuses. Every payer approves in their own wallet.
- Quorail AI through Anthropic, with explicit consent, optional numeric context, server-only keys and Redis-backed request limits.
- Chess against a local bot or a friend, plus tic-tac-toe. Practice only, no NIM rewards.
- Installable web app, offline notice, local backup/export and responsive cream, sage and violet UI.

## Run

Use Node.js 22 and npm. In the folder containing this file:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `/console/?demo=1` is an illustrative workspace with payments disabled. Native wallet operations require opening the deployed HTTPS app inside Nimiq Pay.

For AI, set `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and optionally `AI_DAILY_REQUEST_LIMIT`. Shared boards require the two Redis values. The private planner and games work without these services. Never prefix server secrets with `NEXT_PUBLIC_`.

## Deploy

**V4 uses server routes. Change Vercel's framework preset to Next.js and remove the old `out` output-directory override.** Build with `npm run build`, install with `npm ci`, leave output directory at the framework default. Add server variables in Vercel and redeploy. See [deployment guide](docs/DEPLOYMENT.md) and [start here](START_HERE.md).

## How the calculation works

Amounts use integer Luna, with 100,000 Luna per NIM. The preview subtracts the candidate once, its fee, other outstanding occurrences within the selected horizon, and the reserve. Overdue commitments remain included. Projections assume no new income, price changes or unrecorded spending. Pending transfers remain reserved until verified, making the view temporarily conservative. Covered means covered by the recorded plan, not a guarantee of affordability.

## Payment integrity

The native provider controls signing. Selecting an address in Quorail does not select the native signer. The user must check sender, network, recipient, amount and fee in the wallet. Receipts must match hash, sender, recipient, amount and network and report successful inclusion. Shared receipts additionally require the board's unique transaction reference. Wallet approval or a returned hash alone is not payment confirmation.

An interrupted attempt remains uncertain and blocks repeat sending. Recover the hash from wallet history and verify it instead of retrying blindly. Confirmed means inclusion reported by the configured RPC, not an independent finality proof. Cross-tab locking and persisted attempts reduce duplicates on the same browser. They do not coordinate every external wallet or device.

## Shared plans and privacy

Private plans remain unencrypted in browser local storage, scoped by address and network. Export a backup before upgrading or clearing browser data. Sharing publishes only the selected snapshot to the configured Redis service for 30 days. Invite links are bearer capabilities: anyone with the link can read and claim rows. Responsibility labels are not authenticated identities. Use trusted groups. Private edits do not sync into existing boards; execute each obligation in one place.

Collection requests are incoming contributions, separate from the original outgoing commitment. Receiving contributions never marks rent or another outgoing bill paid. Shared totals update only after matching on-chain verification. No escrow or pooled custody is provided.

AI sends the typed question and, only when selected, numeric balance/reserve/forecast totals to Anthropic through the server. No addresses, titles or hashes are automatically included. The assistant cannot invoke wallet tools or edit plans. Responses may be wrong. Public endpoints are rate limited with Redis, but are not authenticated user accounts. Configure Anthropic spending limits too.

Shared references are public transaction data. Full plans are not stored on chain. A hash cannot restore a lost plan. This version deliberately does not claim on-chain backup or automatic cross-device restoration.

## Architecture

Next.js App Router + React + TypeScript; Nimiq Mini App SDK; chess.js rules; Node API routes for Anthropic and Redis. No Arc contracts, GOAT agent or custody service is required.

- `lib/finance.ts`: exact amounts, recurrence, projections and reserve logic.
- `components/Console.tsx`: private planner and payment lifecycle.
- `components/SharedBoard.tsx`, `app/api/board/route.ts`: shared execution and receipt verification.
- `app/api/assistant/route.ts`: validated, limited Anthropic requests.
- `lib/chess-bot.ts`: local chess opponent, independent of AI API credits.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

Automated tests cover monetary precision, recurrence anchors, duplicate confirmation, receipt mismatches, board references, AI privacy and limits, and game rules. Live Anthropic, Redis and native wallet acceptance require deployment credentials and device testing. See [testing checklist](docs/TESTING.md).

MIT License. chess.js retains its BSD license in `docs/CHESS-LICENSE.txt`. Independently built; no claim of official Nimiq endorsement.
