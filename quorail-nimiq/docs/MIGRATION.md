# V2 to V3

Private local plan version remains 1. New recurrence fields are optional, so existing plans remain readable. Confirmed records retain receipts. Export first and preserve the same domain, browser profile, network and account.

Server routes replace the static-export-only deployment. Set Vercel to Next.js and remove the `out` override. Add Anthropic and Redis credentials for optional services. No old client secret is required. Never import private wallet keys.

The ZIP contains source only, no `.git`, dependencies, build output or local credentials. Extract it at the existing repository root and keep Git history. Obsolete local `out` files are not used by Next.js deployment and must not be deployed.
