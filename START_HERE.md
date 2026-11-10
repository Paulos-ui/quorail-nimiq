# Start here, Jayking

This is the new Quorail-Nimiq project. Extract it into its own Desktop folder. Keep your original Quorail repository separate.

## Run locally

Open the folder containing `package.json` in your terminal:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Click **Explore an example** to inspect the interface without a wallet. The example never sends payments.

## Deploy and test

1. Follow `docs/DEPLOYMENT.md` to create your new public `quorail-nimiq` repository and deploy on Vercel.
2. Open the deployed site inside Nimiq Pay.
3. Complete the real-device checklist in `docs/TESTING.md`.
4. Record the demo and use `docs/SUBMISSION.md` to prepare your entry.

The code builds and the automated tests pass. Native wallet approvals and a genuine payment still require testing on your phone. No public repository, public deployment or competition submission was created as part of this ZIP delivery.

## Included

- Redesigned introduction and mobile payment workspace
- Nimiq SDK integration and exact NIM planning arithmetic
- Create and edit payments, reserve targets, receipt checks and recovery states
- Local plan backup and import
- Rewritten detailed README and MIT license
- Deployment guide, testing record, migration map and submission kit

No database, AI API key, old vault deployment or server wallet is needed. The first version supports NIM only. Plans stay in unencrypted local storage on the current device and origin.
