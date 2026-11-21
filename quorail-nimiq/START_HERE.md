# Upgrade your existing deployment to V4.2

1. Export your real plan from Quorail before upgrading. Keep your deployment domain unchanged.
2. Extract this ZIP into your existing repository folder, where `package.json` lives. It has no enclosing folder and no `.git`, so your Git history remains yours. Your local `.env.local` is not included or overwritten.
3. Run `npm ci`, `npm test`, `npm run build`, then `npm run typecheck`.
4. Configure the Vercel project as **Next.js**. Clear any old output-directory override pointing at `out`. Do not deploy the old static output.
5. Add Anthropic and Redis environment variables using `docs/DEPLOYMENT.md`, then push and redeploy.
6. Test the deployed app inside Nimiq Pay. AI and shared services must be checked with your real configuration before advertising them as live.

From WSL, after downloading the ZIP into the existing Desktop repository folder:

```bash
cd /mnt/c/Users/YOUR_WINDOWS_USERNAME/Desktop/quorail-nimiq
unzip -oq quorail-nimiq-v4.2.zip -d .
rm quorail-nimiq-v4.2.zip
npm ci
npm test
npm run build
npm run typecheck
git add -A
git commit -m "Release Quorail V4 offline backups games and payment upgrades"
git push origin HEAD
```

Use your actual Desktop path and repository folder name. Do not run `git init` again. Before committing, check `git status` and ensure no secret file is staged. `.env.local` is ignored.

Private planning needs no AI key. A real payment needs spendable NIM in the sender's Nimiq Pay wallet, not money sent to a ZIP or a Quorail wallet. The chess bot is local and free of AI API usage. Practice games do not pay rewards.
