# Quorail wallet, QR and currency corrections

This release is designed to unzip directly over the existing `quorail-nimiq` project root, without creating a nested `quorail-nimiq` directory. Keep your `.git` folder untouched.

## Changes
- QR scanning starts camera access when the scanner opens, shows a live video element, and decodes QR using native `BarcodeDetector` where available. A version-pinned jsQR browser fallback is requested from jsDelivr when native decoding is unavailable. This fallback requires network access and the CDN to be reachable. Camera access also requires HTTPS and user permission. Paste-QR fallback remains available. No scan initiates a payment.
- Recipient parsing supports direct Nimiq addresses, Nimiq URI recipient fields, and Polygon EIP-681 direct address requests for chain 137. It intentionally ignores QR payment amounts and other instructions.
- NIM/USD is checked against two independent providers when both are available. Quotes with a large discrepancy are rejected. Both NIM and USDT prices require fresh timestamps, and USDT no longer assumes an exact $1 price.
- USD/local FX rates require provider timestamps, are range checked, and the UI uses a single shared currency preference for both assets. If quotes are unavailable, estimates are hidden rather than invented.
- The USDT disconnected card has a more compact layout.

## Verification limitations
The TypeScript files passed syntax transpilation with TypeScript 5.9. The full `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` could not be completed in this sandbox because package installation requires unavailable network access. **Do not treat this as a verified production release until those commands pass in your development environment.** Camera decoding must be tested on an actual phone in the Nimiq Pay webview and in Chrome. The jsQR CDN fallback should be self-hosted and integrity-pinned before a security-sensitive production release.

## Local verification
```bash
npm ci
npm run typecheck
npm test
npm run build
```

## Deployment
```bash
cd "/mnt/c/Users/MY PC/Desktop/quorail-nimiq"
unzip -oq "/mnt/c/Users/MY PC/Desktop/quorail-wallet-qr-currency-fix.zip" -d .
npm ci && npm run typecheck && npm test && npm run build
git add -A
git commit -m "Improve Quorail QR scanning, currency quotes and USDT card"
git push origin HEAD
```
