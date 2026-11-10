# Deploy Quorail-Nimiq

## 1. Create a separate project folder

Extract this ZIP into a new `quorail-nimiq` folder on your Windows Desktop. Do not extract over the original Quorail repository. Open the new folder in your terminal. The folder containing `package.json` is the project root.

From WSL, Windows Desktop is usually below `/mnt/c/Users/YOUR_WINDOWS_USERNAME/Desktop/`. Some computers use OneDrive/Desktop. Use the actual folder location on your machine.

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

The development address is `http://localhost:3000`. No database, contract deployment or AI API key is required. Stop the dev server with Ctrl+C when finished.

## 2. Create the new public GitHub repository

Create an empty public repository named `quorail-nimiq` under `paulos-ui`. Do not initialize it with another README or license.

In the extracted project root:

```bash
git init
git branch -M main
git add -A
git commit -m "Build Quorail Nimiq payment planner"
git remote add origin https://github.com/paulos-ui/quorail-nimiq.git
git push -u origin main
```

Use your existing GitHub identity. Before committing, inspect `git config user.name` and `git config user.email`; use your own name and verified email. Do not copy an unrelated author's identity. No Git history from the earlier project is bundled in this ZIP.

## 3. Deploy on Vercel

1. Import the new repository.
2. Use the repository root containing `package.json`.
3. Select framework preset **Other** for this static export.
4. Install command: `npm ci`.
5. Build command: `npm run build`.
6. Output directory: `out`.
7. Use Node.js 22 or later.
8. Deploy, then open the HTTPS URL and test `/`, `/console/`, `/console/?demo=1` and `/docs/`.

`vercel.json` supplies these settings and standard security headers. No secret environment variables are needed. If overriding the public RPC endpoints, add the matching `NEXT_PUBLIC_NIMIQ_MAINNET_RPC` and `NEXT_PUBLIC_NIMIQ_TESTNET_RPC` variables, then redeploy.

The app is static. `next start` is not used for production. Other static hosts can serve the generated `out/` directory with directory-index routing.

## 4. Open in Nimiq Pay

On the deployed connection screen, tap **Open this app in Nimiq Pay**. The app creates a deep link from its current domain to its `/console/` route. Nimiq Pay may warn before opening an unlisted Mini App.

Alternatively, use the documented URL pattern, replacing the domain:

```text
https://nimpay.app/miniapps/open/YOUR_DEPLOYED_DOMAIN/console/
```

The exact handling of a path-bearing deep link must be checked on your installed Nimiq Pay version. If it does not preserve the path, open the root domain through Nimiq Pay and use the Open Quorail button inside the app.

The native host must expose its network and `getBalance`. Update Nimiq Pay if the app asks. Unknown networks do not silently default to mainnet.

## 5. Perform the device acceptance test

Follow `TESTING.md`. Use testnet first. You must personally approve wallet prompts. Verify the actual transaction in the network-appropriate explorer before recording a successful demo.

Use only an ordinary account you control as the planning account. Confirm that Nimiq Pay chooses that same account in its native send dialog. Use another wallet you control as the recipient for your acceptance test.

## 6. Prepare submission

Update `docs/SUBMISSION.md` with the real deployed URL, public repository URL, demo URL and genuine test evidence. Submit through the official competition portal. Verify the submission is accepted before the official deadline. Publishing a repository alone does not submit the entry.

## Operations

- Keep the domain and deployment origin stable to preserve local plans.
- Maintain a working RPC service for each supported network.
- Confirm CORS from the actual deployed origin.
- Keep the app live and review dependency updates.
- Back up plans before changing browser storage or moving devices.
- If receipt checks fail, inspect the explorer and RPC health. Do not tell users to resend pending payments.

## Version 2 installation checks

Deploy the full Next.js project or the entire static `out` folder at the domain root. Serve `/manifest.webmanifest`, `/sw.js`, `/offline.html` and `/icons/` without redirects to the landing page. Do not cache `sw.js` indefinitely. HTTPS is required. Verify the install action on Android Chrome, Windows Edge and iOS Safari. Installed standalone Quorail does not have Nimiq Pay's wallet bridge. Wallet payments continue inside Nimiq Pay.

After deploying, test the Play room, then reopen inside Nimiq Pay and complete the existing testnet payment acceptance checklist. Practice games pay no NIM. Do not advertise earning rewards from this release.
