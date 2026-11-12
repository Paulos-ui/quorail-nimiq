# Quorail v4.3.2 mobile header update

Complete source release based on v4.3.1, including payment, balance and receipt features.

- Dashboard header uses two deliberate mobile rows: title and preferences, then wallet status and action.
- Connect and disconnect controls have readable labels and 44px touch targets.
- Language menu stays aligned to the right-side settings controls, with a viewport width cap and scrollable content.
- Outside taps and Escape dismiss preferences; Escape returns keyboard focus.
- Dark mode now styles the dashboard header. Fixed the toggle reading a nonexistent resolved-theme attribute.
- Landing header groups the brand and preferences, followed by navigation. On mobile, the hero provides the primary launch button without a duplicate header button.

Validation: production build passed; 65 existing tests passed. Local production server started successfully. Browser visual checks were blocked by this environment denying Chromium socket creation. Please check light/dark mode, language menu and wallet connection on a phone after deployment.

Deploy: replace project source with this archive while retaining your .git and .env.local. Run npm ci and npm run build, then commit and push. Use the Next.js Vercel preset with no custom out directory. No new environment variables are required.
