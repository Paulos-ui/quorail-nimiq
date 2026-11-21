# Quorail V4 release notes

## Included source

A complete release, not a patch. Includes V3.2 payment previews, receipt polling, recurrence, collections, scenarios, focused AI and V3.2.1 Redis environment compatibility. No credentials, dependencies, build output or Git directory are bundled.

## New in V4

1. Offline companion at /offline.html, cached with its own script. Lists this browser's saved plans and exports plain JSON. It never shows a current wallet balance or executes payments. Saved receipt states are explicitly unverified offline. No RPC, API responses or financial app bundles are cached.
2. Optional encrypted backup export from the backup card. Import in Planning settings after entering the backup password. AES-256-GCM, random 96-bit IV and 128-bit salt, PBKDF2-SHA256 with 310,000 iterations. No password recovery. Web Crypto needs HTTPS or localhost. Encryption applies to the exported file only.
3. Connect Four: local bot prioritizes winning, blocking and avoiding an immediate losing reply. Distinct disc symbols, numbered column controls, accessible status and reset. No money involved.
4. Visible keyboard focus, reduced-motion preference and mobile layout improvements.

## Validation

51 automated tests pass, including encrypted roundtrip, wrong password/tampered file rejection, random salts/IVs, game gravity/wins and bot tactics. Production Next.js build passes. Existing tests cover finance, APIs and receipt validation with mocks. Offline DOM-harness tests also check malformed records, text-only rendering and exported JSON. Browser preview could not run in this environment, so visual and native-device acceptance remains required. These tests do not prove live wallet, Redis or Anthropic behavior.

## Deliberate exclusions

No NFT minting, game payouts, automatic payments, USDT, wallet keys, auto cloud backup or on-chain restoration. No recorded native payment video is bundled. Follow DEMO_SCRIPT.md to record your real wallet flow. Local backup import preserves existing settings and records, merges new records, and rechecks imported payment attempts.

## Deployment

Follow START_HERE.md. No new environment variables beyond V3.2.1. Export your plan before upgrading. Keep the current domain. Do not clear site data to update the app. Close old tabs and reopen online to activate the new offline companion.
