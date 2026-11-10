# Verification and device acceptance

Verified on November 10, 2026.

## Completed in the build environment

| Check                                      | Result                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| TypeScript strict typecheck                | Passed                                                                                    |
| Next.js production build and static export | Passed                                                                                    |
| Automated tests                            | 12 passed, 0 failed                                                                       |
| Production dependency audit                | 0 reported vulnerabilities after PostCSS override                                         |
| Desktop landing                            | Visually inspected; payment-preview toggle updates figures                                |
| Example workspace                          | Visually inspected; demo sending is disabled                                              |
| Mobile workspace at 390px                  | Inspected in a browser iframe at mobile viewport width                                    |
| Payment editing                            | Changing example equipment from 250 to 100 NIM updates remaining room from -100 to 50 NIM |
| New payment validation                     | Invalid address rejected; valid 1.23456 NIM example commitment added accurately           |
| Settings                                   | Reserve change recalculates remaining room                                                |
| Dialogs                                    | Keyboard focus managed; Escape and focus-cycle behavior implemented                       |
| Mainnet RPC                                | Read-only getTransactionByHash request succeeded; response fields match receipt parser    |
| Testnet RPC                                | Read-only latest-block request succeeded                                                  |
| RPC CORS                                   | Both default endpoints returned Access-Control-Allow-Origin: *                            |
| Copy scan                                  | No em dashes in shipped source or documentation                                           |

A public blockchain transaction was read to check the RPC response shape. It was not created by Quorail and is not evidence of app usage. No native wallet payment was performed by the build agent.

## Automated coverage

1. Exact integer Luna conversion, including 0.00001 NIM.
2. Rejection of negative, exponential, malformed and over-precision amounts.
3. Selected payment excluded from competing obligations; fee counted once.
4. Overdue commitments included; outside-window commitments excluded.
5. Pending payments remain reserved; confirmed payments leave outstanding totals.
6. Nimiq address format and checksum validation.
7. Invalid backup settings and duplicate IDs rejected.
8. Matching included successful receipts confirm; failed execution does not.
9. Wrong sender, recipient, amount, hash and network cannot confirm.
10. A hash alone or incomplete evidence remains pending.
11. Storage scope distinguishes account and network.
12. Interrupted submission recovers as uncertain after reload.

Run:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

## Required real-device checks before submission

These remain unverified until the builder runs them in Nimiq Pay. A normal browser and an iframe do not reproduce the native wallet bridge.

| Scenario                                 | Expected outcome                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Open deployed HTTPS app inside Nimiq Pay | SDK initializes; host network is shown correctly                               |
| Deny account access                      | Clear cancellation; no fabricated connected state                              |
| Connect a current host                   | Shared addresses and actual selected-account balance appear                    |
| Switch planning account                  | Correct account-specific local plan and balance load                           |
| Testnet and mainnet                      | Correct network, RPC service and explorer link                                 |
| Add a small testnet payment              | Recipient checksum and five-decimal amount accepted                            |
| Preview a target-crossing payment        | Approval action blocked with exact shortfall                                   |
| Approve an affordable testnet payment    | Native wallet shows correct recipient, value and explicit fee                  |
| Verify native sender                     | Same account as the selected planning account                                  |
| Cancel approval                          | Record remains planned and can be reviewed again                               |
| Approve transfer                         | Returned hash stored; state pending, not immediately confirmed                 |
| Check receipt                            | Sender, recipient, network, value, successful execution and inclusion verified |
| Reload while pending                     | Attempt retained; duplicate send blocked                                       |
| Interrupt during submission              | Record becomes uncertain; no automatic retry                                   |
| RPC unavailable                          | Pending state preserved; clear error, no invented confirmation                 |
| Export and import backup                 | Same-account records merge; attempted imports require verification             |
| Reopen same origin on same device        | Local plan still available                                                     |
| Phone back button, keyboard, long labels | No trapped or hidden critical controls                                         |

Start on testnet and send only between accounts you control. The builder must approve wallet dialogs. Do not perform destructive interruption experiments with meaningful mainnet funds.

## Acceptance record

Fill this in after device testing:

- Deployed URL:
- Nimiq Pay version:
- Phone / operating system:
- Network:
- Public transaction hash:
- Explorer URL:
- Successful receipt verified:
- Cancelled approval verified:
- Reload recovery verified:
- Tester feedback and fixes:

## Limits of these checks

Automated arithmetic and receipt tests do not constitute a security audit. A successful build does not prove native host compatibility. The public RPC services have no uptime guarantee. Local records are not tamper-proof and cannot establish ownership or payment success without on-chain verification.

## Version 2 checks

- Tic-tac-toe bot response, reset, draw and terminal-state locking.
- Chess: e2 to e4, undo, reset, legal destination indicators, promotion selector.
- Money moves: reject 250 and 350; explain 150 and the effect of fees.
- Install button: native prompt when available, platform instructions otherwise.
- Mobile widths: landing, Play room and console at 390px.
- Remaining device acceptance: HTTPS production installation, service-worker offline fallback and Nimiq Pay testnet transaction. These are not claimed as tested in the desktop preview.
