# Payment receipts in V4.3.1

Deploy this full source ZIP over V4.3, preserving .git and environment files. Run npm ci, npm test and npm run build, then commit and push.

After deployment, open Activity and choose View receipt on the already confirmed payment. No second transfer is needed. The detail dialog shows a Quorail receipt instead of another payment forecast. Download receipt image saves a PNG. Save printable receipt saves an HTML file that can be opened in a browser and printed to PDF. Native WebViews may delegate downloads to the phone browser; check Downloads.

Verified by Quorail is the stored first verification time, not an invented block timestamp. Existing timestamps cannot be reconstructed if an earlier release overwrote them. Receipt fields come from the saved confirmed payment and verified sender/fee. The amount and recipient were checked during confirmation. Receipt files are plain, unencrypted records containing addresses and hashes. Explorer links allow an independent lookup.

The previous balance/payment fixes remain included. Live sending was reported working by the user; this update does not initiate payments. Native download behavior and visual layout still require a phone check.
