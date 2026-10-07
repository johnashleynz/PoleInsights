# Pole Insights Cloudflare deployment

## P28 Current Runbook (8 October 2026)

The authoritative current instructions are [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
The active site is pole-insights.pages.dev, built from dev, with a Pages Function
and a separate production Zero Trust OTP application. Runtime secrets are required
for Grid Manager. The historical setup below predates integrations: its statements
about a static-only demo, optional protection and P27 footer are not current P28
deployment instructions. The proposed custom domain below is not claimed as active.

Goal: host the current prototype at `https://poleinsights.digitalartisans.co.nz` using Cloudflare Pages connected to GitHub, so every push to the chosen branch rebuilds and redeploys the site.

Cloudflare references:

- Git integration: https://developers.cloudflare.com/pages/configuration/git-integration/
- GitHub integration: https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- Custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/

## Current project facts

- Git repository: this `source` folder
- GitHub remote: `https://github.com/johnashleynz/PoleInsights.git`
- Current branch: `dev`
- Node requirement: `22.13` or newer
- Framework/build tool: Vite + React
- Build command: `npm ci && npm run build`
- Build output directory: `dist`
- No backend runtime, Worker route, secrets, database, or API binding is required for the demo.
- The generated site must be served over HTTP/HTTPS. Do not open `index.html` directly because the prototype uses web workers.

The workspace root is not the Git repo. Push and pull from the `source` folder.

```powershell
cd "C:\Source\InnerViewInsights\Pole Insights\source"
git status
git switch dev
git pull
npm ci
npm run build
git push origin dev
```

## Recommended Cloudflare setup

Use Cloudflare Pages, not GitHub Pages. This matches the previous automatic rebuild pattern: Cloudflare connects to the GitHub repository and deploys on every push.

1. Log in to Cloudflare.
2. Go to **Workers & Pages**.
3. Select **Create application**.
4. Select **Pages**.
5. Select **Connect to Git**.
6. Authorize the **Cloudflare Workers and Pages** GitHub app if prompted.
7. Select repository `johnashleynz/PoleInsights`.
8. If Cloudflare asks for install scope, grant access only to this repository.

Use these project settings:

| Setting | Value |
| --- | --- |
| Project name | `pole-insights` |
| Production branch | `dev` for the urgent demo, or `main` later when promoted |
| Root directory | Blank or `/` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Node version variable | `NODE_VERSION=22.13.0` |

Important repository note: the Git repository root is already the local `source` folder. In GitHub, `package.json`, `vite.config.ts`, and `src/` should appear at the top level of the repo. If they do, leave Cloudflare's root directory blank or `/`. Only set the Cloudflare root directory to `source` if the GitHub repository actually contains a top-level `source/` folder.

## Custom domain

After the first successful Pages deployment:

1. Open the new Pages project in Cloudflare.
2. Go to **Custom domains**.
3. Add `poleinsights.digitalartisans.co.nz`.
4. Let Cloudflare create or guide the DNS record.

If `digitalartisans.co.nz` is already in the same Cloudflare account, Cloudflare should create the DNS record automatically when the custom domain is attached to the Pages project.

If DNS is managed somewhere else, create this record after adding the custom domain in Pages:

| Type | Name | Target |
| --- | --- | --- |
| `CNAME` | `poleinsights` | the generated Pages hostname, for example `pole-insights.pages.dev` |

Do not create the CNAME before adding the custom domain to the Pages project. Cloudflare documents that a manually added CNAME without the Pages custom-domain association can fail to resolve correctly.

## Demo safety options

For a public prototype demo, leave the Pages site public.

For a restricted demo, add Cloudflare Access after the Pages deployment works:

1. Go to **Zero Trust**.
2. Create an Access application for `poleinsights.digitalartisans.co.nz`.
3. Use email one-time PIN login.
4. Add only the reviewer email addresses or trusted domains.
5. Test in a private browser window before sending the link.

## Local preflight before pushing

Run this from the Git repo root:

```powershell
cd "C:\Source\InnerViewInsights\Pole Insights\source"
npm ci
npm test
npm run build
```

Expected result: `npm run build` writes the production site to `dist/`.

For a quick local production smoke test:

```powershell
cd "C:\Source\InnerViewInsights\Pole Insights\source"
npx vite preview --host 127.0.0.1 --port 5191
```

Open `http://127.0.0.1:5191/`.

## Manual emergency deploy

If the GitHub integration is blocked and the demo needs to go live immediately, deploy the built `dist` folder directly with Wrangler:

```powershell
cd "C:\Source\InnerViewInsights\Pole Insights\source"
npm ci
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name pole-insights
```

Then attach `poleinsights.digitalartisans.co.nz` to the `pole-insights` Pages project as described above.

The repository already contains a staging helper:

```powershell
npm run deploy:staging
```

That deploys to `pole-insights-staging`; use it only for staging, not the public demo domain.

## Ongoing update flow

After Cloudflare Pages is connected to GitHub:

```powershell
cd "C:\Source\InnerViewInsights\Pole Insights\source"
git status
npm test
npm run build
git add .
git commit -m "Prepare Pole Insights demo deployment"
git push origin dev
```

Cloudflare should start a new deployment automatically after the push. Watch the deployment log in **Workers & Pages > pole-insights > Deployments**. When it finishes, check:

- `https://poleinsights.digitalartisans.co.nz`
- The header shows `Pole Insights`
- The footer shows `P27 DEV - P26 base - Local review`
- Setup, Innerview/Detect, Stresses, Compare A/B, Videos, Save/Open all load without console errors

## Later production cleanup

After the sprint demo, promote intentionally:

1. Merge `dev` into `main` only after review.
2. Change the Cloudflare production branch to `main`.
3. Keep `dev` as preview deployments.
4. Decide whether `pole-insights-staging` is still useful or should be retired.
