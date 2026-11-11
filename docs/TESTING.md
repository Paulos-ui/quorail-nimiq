# V3 acceptance checklist

## Automated

Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`. Tests use deterministic data and mocked provider requests. They are not evidence of a real transfer, funded reward or deployed external service.

## Browser

- Open `/console/?demo=1`. Switch 30/60/90 days. Monthly studio rent should increase future commitments.
- Preview a payment and adjust the reserve. Invalid input must prevent payment; risky totals remain blocked.
- Add weekly/monthly commitments. Inspect due dates, fees and horizon totals. Month-end anchors should recover after February.
- Open Quorail AI. Submit requires consent. Numeric context is opt-in and previewed. Missing deployment settings show a clear error.
- Open `/play/`, choose chess, play a white move and observe a legal black reply. Undo, restart and friend mode work. No rewards are advertised.
- Check narrow mobile layout, keyboard focus, dialogs and footer links.

## Native wallet

1. Export a backup. Open the deployed HTTPS app inside Nimiq Pay.
2. Connect, verify network and choose an ordinary spendable account. Confirm this matches the native wallet sender.
3. Create a small commitment to another account you control. Set a reserve that permits it.
4. Preview, approve personally in the wallet and check the returned hash is attached to the commitment.
5. Keep the workspace open. Confirm automatic verification updates the receipt, balance and plan. Inspect the same hash in the appropriate explorer.
6. Check a recurring confirmation produces exactly one next occurrence and preserves the old receipt.
7. Cancel another native prompt. It must return to planned. If the wallet reports an ambiguous error, do not retry; recover its hash and verify it.
8. Reload during a pending attempt. It must not become freely payable again.

## Shared boards with Redis configured

- Create a team snapshot with trusted test accounts. Copy the full fragment invite to another browser. Both must see matching rows and totals.
- Claim one row and verify another browser cannot claim it concurrently.
- Approve a small payment in Nimiq Pay. Native details must contain the board reference. Verify only the matching receipt confirms that row.
- Wrong reference, recipient, amount or network must not confirm. A plain ordinary payment without the memo is not a board receipt.
- Create a split collection with an odd Luna remainder. All shares must sum exactly to the commitment amount. Verify one share gives a partial collection total and all shares give a full total.
- Collection must not mark the original outgoing bill paid. Private plan edits do not change a board snapshot.
- Keep uncertain claims blocked and recover hashes from wallet history. Do not force-reset a possibly sent transfer.

## Anthropic with credentials configured

- Ask a generic question with context off, then a question with the numeric summary on.
- Confirm a real answer and check usage in your own Anthropic Console.
- Confirm the API key is not present in browser bundles, responses or Git history.
- Test request limit and unavailable Redis feedback. Configure your provider spending controls.

## Release limits

Native wallet, production Redis and real Anthropic calls require your own deployment test. No full on-chain plan restoration, auto-debits, authenticated team roles, USDT support or game rewards are implemented. Shared boards are expiring snapshots with receipt updates, not a fully synchronized private-plan database.

## V3.1 additions

Open the landing-page robot button. Check Escape and the close button return focus to the launcher. Submit a generic question after consent with your deployed Anthropic key. No private plan is loaded on the landing page.

Try all three example links, then change the scenario from the workspace. Examples never create receipts or allow payments. Check the reserve signal on Overview, Payments and Activity. Preview a planned payment and open the two-week delay comparison. Verify it does not alter the due date. The AI question must visibly include the same deterministic figures before sending.
