# Competition submission kit

Category: **Pay**

Project name: **Quorail**

Repository name: **quorail-nimiq**

Builder: **Jayking**

GitHub: https://github.com/paulos-ui

X: https://x.com/__official__1

## Description, under 250 words

Quorail helps freelancers and small teams see what a NIM payment leaves behind.

A wallet balance can cover a payment while the same money is already needed for rent, a collaborator or another upcoming commitment. Quorail brings those obligations into the payment decision.

Inside Nimiq Pay, users connect their wallet, record upcoming payments and set a reserve target. Before sending, Quorail shows the remaining balance after the selected payment, its fee, other recorded commitments and the reserve. Payments that cross the target are paused so users can revise their plan.

The Mini App uses the Nimiq Mini App SDK for account access, network context, consensus, live balances and native wallet-approved NIM transfers. Transaction receipts are checked against the expected sender, recipient, amount and network before successful inclusion is recorded. Pending or uncertain transactions are retained for reconciliation, with no blind retries.

Quorail uses exact integer Luna arithmetic and keeps plans locally on the user's device, with backup export and import. Its mobile interface focuses on Overview, Payments and Activity. A clearly labeled example workspace explains the product without moving funds.

This is a Nimiq adaptation of my original Quorail payment-planning concept, with a new wallet execution flow and redesigned experience. The source is MIT licensed.

## Complete before submitting

- [ ] Public GitHub repository URL
- [ ] Public deployed HTTPS Mini App URL
- [ ] Native Nimiq Pay test completed on a real device
- [ ] Genuine successful transaction and independent explorer verification
- [ ] Cancelled approval and reload recovery checked
- [ ] Mobile screenshots and short walkthrough recorded
- [ ] Real testers invited and their feedback recorded with permission
- [ ] Accurate usage evidence, without counting example-mode activity as real payments
- [ ] Submission form completed and acceptance verified
- [ ] Payout wallet information entered by the builder in the official portal

## 60 to 90 second demo outline

1. Start with the problem: a balance does not show its commitments.
2. Open the app inside Nimiq Pay and show the network and account.
3. Show a recorded payment, another upcoming obligation and the reserve target.
4. Preview a payment that would cross the target. Show the exact shortfall.
5. Revise or defer a commitment, or use a separate affordable test payment.
6. Show the refreshed preview, then personally approve in the wallet.
7. Open Activity and verify the genuine transaction receipt and explorer.
8. Close with the benefit: see the consequence, then decide.

Use the example workspace only when clearly introduced as an example. Do not edit footage to suggest a mock transfer was real. Record the live sequence only after device acceptance passes.

## Promotion and evidence

Share the working product link, the specific problem, a real walkthrough and a request for concrete usability feedback. Record meaningful test feedback and fixes. Do not publish invented user counts, payment volume, endorsements or prize claims.
