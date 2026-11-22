# V4.1 mobile fixes and acceptance

## Reported symptoms

The screenshot showed Nimiq Pay reporting Server not available, a selected account showing zero in Quorail, and a fee entered as 05. The supplied recipient passed checksum validation. The screenshots do not establish the exact cause of the balance discrepancy: the selected account, wallet network and host connectivity must be checked on the device.

## Changes

Read-only balance calls check network consensus, validate integer Luna, time out, and show retry/help. Successful zero responses are not fabricated into totals. Errors appear next to the mobile form submit button. Amount and fee errors are separate. Native required/date-field validation also produces visible text. Every disabled payment state has an explanation. The connection path no longer disconnects the provider immediately before requesting accounts.

## On-device checks

1. Install this release and keep your existing domain/data. Check Nimiq Pay's connection first. If Server not available persists, Quorail cannot repair that host service.
2. Connect Quorail. Verify mainnet and select the exact funded account using the account selector. Tap Refresh. A successful zero means the provider returned zero for that selected account; it does not prove the wallet-wide total is zero.
3. Add a commitment with a clearly written fee: 0, 0.5 or 5 NIM. 05 is deliberately rejected. Adding a commitment only creates a plan and opens the payment preview.
4. In the preview, review the reserve/commitments, confirm the account checkbox and approve in Nimiq Pay only if you intend to transfer. Weekly recurrence counts future occurrences in projections and requires separate approval for each occurrence.
5. Verify the hash and receipt. If an attempt is pending or uncertain, reconcile it instead of paying again.

Automated checks: 55 tests pass, including unsynced balance behavior, valid zero, invalid balance, read timeout and fee ambiguity. Native-device transfer and production connectivity are not verified by these tests.

Provider reference: https://www.nimiq.dev/mini-apps/faq
