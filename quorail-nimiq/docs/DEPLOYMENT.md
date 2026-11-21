# V4 deployment and configuration

## Existing Vercel project

Keep your current repository and domain. In Vercel Project Settings, Build and Deployment:

- Framework preset: Next.js.
- Root directory: folder containing package.json.
- Install command: npm ci.
- Build command: npm run build.
- Output directory: framework default. Remove the V2 override `out`.
- Node.js: 22.

V4 requires server functions for `/api/assistant/` and `/api/board/`. It cannot be deployed as a static `out` folder. `vercel.json` now declares Next.js. Check project dashboard overrides as well.

## Environment variables

Create an Anthropic API key in your own Anthropic Console. Create an Upstash Redis database and copy its REST URL and REST token from its dashboard. Add the following to Vercel for Production and any intended Preview environments:

| Variable                      | Value                                                                      | Required for                |
| ----------------------------- | -------------------------------------------------------------------------- | --------------------------- |
| ANTHROPIC_API_KEY             | Your secret Anthropic API key                                              | AI                          |
| ANTHROPIC_MODEL               | claude-haiku-4-5-20251001, or a compatible model available to your account | AI                          |
| UPSTASH_REDIS_REST_URL        | Your database HTTPS REST URL                                               | AI limits and boards        |
| UPSTASH_REDIS_REST_TOKEN      | Your database secret REST token                                            | AI limits and boards        |
| AI_DAILY_REQUEST_LIMIT        | 100 initially, lower if desired                                            | AI global daily request cap |
| NEXT_PUBLIC_NIMIQ_MAINNET_RPC | Optional public CORS-enabled RPC URL                                       | Receipt verification        |
| NEXT_PUBLIC_NIMIQ_TESTNET_RPC | Optional public CORS-enabled testnet RPC URL                               | Receipt verification        |

Do not put secrets in browser code, GitHub, NEXT_PUBLIC variables or screenshots. Do not send keys in chat. Use separate Redis databases for production and previews if you want isolation. Redeploy after changing environment settings. For local development, copy `.env.example` to `.env.local` and fill values there.

AI fails closed if its key or Redis limits are unavailable. Default limits are 100 requests/day globally and 20/client/hour. Global configurable maximum is 1000/day. These are request limits, not a guaranteed currency spending cap. Set a spending limit in Anthropic too. Questions are limited to 1200 characters and responses to 650 tokens. No automatic or background AI calls occur.

Boards expire after 30 days. Creation is limited globally and by client. Anyone with a secret invite can view and claim a row. No user identity service or admin recovery panel is provided. Redis loss or expiry removes the board, not on-chain payments. Keep backups.

## Nimiq Pay

Install or update Nimiq Pay. Open your deployed app within its Mini Apps browser using its custom URL entry if available. Connect there. Chrome and installed standalone Quorail do not inject the native wallet provider.

V4.2 replaces the directory deep link with a setup dialog. Users can scan an official store QR, tap a store link on the same phone, or copy Quorail's URL into Nimiq Pay's Mini Apps. Browser installation detection is not reliable; only native provider presence is detected.

Shared links include their secret after `#`. Preserve the full link when opening it inside the wallet. Never post a private team invite publicly.

## Acceptance before announcing

Follow TESTING.md. Verify real wallet execution with testnet or a personally approved small transfer, then verify the explorer receipt. Check one actual Anthropic response with your key and two browsers viewing the same shared board. No credentials or live payment approval are bundled in the ZIP.

## V4 compatibility and offline upgrade

Vercel-injected `KV_REST_API_URL` and `KV_REST_API_TOKEN` are accepted as an alternative complete pair to the Upstash variables. Use a read/write REST token, not a read-only token or a TCP REDIS_URL. No new secrets are required for V4.

After deploying, close all old Quorail tabs and reopen online so the updated service worker can activate. The offline companion must be cached on that browser before an offline visit. Some wallet webviews may disable service workers or downloads; test on your device. The companion is read-only and cannot see storage from another browser or wallet webview.

Production is not updated by downloading this ZIP. Push to the repository connected to your Vercel project, confirm the new deployment is Ready, then perform the native acceptance tests. Keep the same domain and export your plan first.

Official deployment reference: https://vercel.com/docs/frameworks/full-stack/nextjs
