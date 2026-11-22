# Quorail V4.3

## Why the displayed balance was zero

The old implementation queried the first shared address. Nimiq Pay holds its spendable NIM in the current HTLC exposed as the second address by listAccounts. Incoming funds on the stable address are pending top-ups, not the home-screen spendable balance.

Primary integration reference: https://nimiq.dev/mini-apps/api-reference/nimiq-provider#accounts-and-signing

V4.3 uses the documented current contract, observes account updates and checks for rotation during a read. Failed reads remain unavailable. No manual or assumed balance is inserted. No additional balance API key or Redis setting is required. Nimiq Pay must be current and connected.

## Payment and recurrence behavior

The private plan remains keyed by the stable address and network. Before sending, Quorail refreshes the native balance, checks amount plus fee and the reserve, records the expected contract sender and persists the submitting state. Wallet approval is still required. A returned hash remains pending until the matching receipt is checked. Confirmation generates the next recurring occurrence once. Weekly and monthly entries never authorize automatic debits.

Existing pending attempts created before V4.3 do not have a captured contract sender. Do not delete or resend them to fix a mismatch. Inspect their wallet history and reconcile the actual transaction first. Receipt checks still require a working configured RPC endpoint; wallet balance queries use the native bridge directly.

## Interface and localization

Preferences moved into navigation. Sun/moon toggles immediately; the language menu also offers a system theme. Spanish, German and French cover the static app copy, guide, payment messages, main dynamic statuses and offline companion. User-entered names and questions, wallet addresses, transaction hashes, protocol identifiers and unknown external diagnostics are not rewritten. Native wallet and browser validation dialogs follow device/browser settings. Some highly contextual AI prompt text and diagnostic details may remain English; do not describe localization as universally complete.

## Deployment

1. Export a plan backup before replacing the app.
2. Overwrite the existing repository with this ZIP, preserving .git and local environment files.
3. Run npm ci, npm test, npm run build.
4. Commit and push. Vercel framework preset: Next.js. Remove any Output Directory override pointing to out.
5. Open the new production deployment inside updated Nimiq Pay. Refresh the page to load the new bundle.

## Real-device acceptance

- Compare Quorail and Nimiq Pay NIM balances on the same network after pending top-ups settle.
- Preview a small payment to a recipient you control or have verified, check amount/fee/reserve and approve only if intended.
- Confirm the returned hash, explorer recipient and amount, then receipt confirmation in Quorail. No transfer was performed by the build process.
- Confirm that paying one weekly/monthly occurrence creates only one next occurrence, and never submits it automatically.
- Leave and return to the app, check balance refresh and switch themes/languages on mobile.
- If a native request fails, retain its exact error. If submission outcome is uncertain, inspect history before retrying.

## Validation limits

Automated tests and production compilation are supplied. Browser visual automation is restricted in the build environment, so the revised mobile layout has not received a real-browser screenshot review here. Actual wallet approval, RPC confirmation availability and Anthropic responses need live deployment checks.
