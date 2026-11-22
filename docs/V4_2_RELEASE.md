# V4.2 release and device checklist

Full source release including every V4.1 change. No new environment variables or runtime dependencies.

## Language scope

English, Spanish, German and French primary controls: navigation, payment-form labels, reserve headings and wallet setup. User data, addresses, amounts and transaction identifiers are not translated. Longer explanatory content, technical errors, AI answers and guides may be English. Complete localization remains future work. Preferred language and appearance are stored on this browser.

## Wallet onboarding

Outside the injected Nimiq environment, Connect shows an accessible setup dialog with Escape and focus handling. Google Play and App Store tabs provide locally generated store QR codes and matching direct download links. Already-installed instructions copy the app URL; shared invites preserve their secret fragment. No installation claim is inferred from an unsuccessful deep link.

Official sources verified November 11, 2026:

- https://play.google.com/store/apps/details?id=com.nimiq.pay
- https://apps.apple.com/app/nimiq-pay/id6471844738
- https://www.nimiq.com/nimiq-pay/

## Appearance

Light/dark/system applies to the main Next.js interface. The static offline fallback remains light and English. System mode follows OS changes. QR codes retain a white background for scanning.

## Acceptance

1. In a regular browser, click Connect Nimiq Pay. Confirm a setup dialog appears without opening the mini-app submission directory.
2. Scan each store QR with another phone and test the direct buttons on the same phone.
3. Open Quorail inside Nimiq Pay and verify Connect still invokes native account selection.
4. Switch languages and appearance, reload and confirm preferences persist. Inspect the payment preview, reserve indicators, AI panel and games at phone width.
5. Repeat V4.1 balance and native transfer acceptance. This update does not resolve an outage inside Nimiq Pay.

57 automated tests passed and the production build passed. Both QR codes were independently decoded and matched to their intended store URLs. Visual/mobile/native-wallet acceptance still requires a device; no live transfer was made during development.
