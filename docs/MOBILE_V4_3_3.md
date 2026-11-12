# v4.3.3 mobile header correction

Connect wallet and Disconnect now occupy the top-right header cell. Overview stays left. Wallet status and appearance/language controls sit below, with planning settings when available.

Open Quorail is restored to the landing header at the top-right beside the brand. Appearance controls and navigation have their own rows. The language dropdown is anchored on the right. This supersedes the v4.3.2 decision to hide the landing header launch button.

Includes all v4.3.2 fixes and preceding balance, payment and receipt functionality. No environment changes.

After pushing and deploying, open /release.json on your production domain. It must report version 4.3.3. If not, check the production deployment commit. Close and reopen the Mini App once the production version is correct. No need to clear browser storage, which could remove locally stored plans.

Production build validated. Actual device rendering requires testing after deployment; Chromium visual testing is unavailable in this build environment.
