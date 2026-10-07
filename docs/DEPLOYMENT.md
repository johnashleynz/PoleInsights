# Pole Insights P28 Cloudflare Deployment

Updated 8 October 2026. The active review site is `https://pole-insights.pages.dev/`,
GitHub repository johnashleynz/PoleInsights, production branch dev. This is the
Cloudflare project's Production environment, not a declaration of production-ready
engineering software. P26 remains at baseline commit 5c273fe; promotion is separate.

## Build and Function

Pages connects to GitHub; pushes to dev trigger a build. The repository root is
already the local source directory: leave the Pages root directory blank, output
dist, build command `npm ci && npm run build`, NODE_VERSION 22.13.0 or newer.
The current UI screenshot uses 22.13.0. The repo contains `functions/` alongside
package.json: Git-integrated Pages must compile it as well as publishing dist.
Grid Manager uses `functions/api/grid-manager/[[path]].ts`, not a separate Worker.
A static-only dist upload does not provide that API. Existing deploy:staging targets
pole-insights-staging and is not the active production hostname.

[Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
describes automatic branch deployment. No DNS/custom-domain changes are required.

## Server Variables and Secrets

Workers & Pages > pole-insights > Settings > Variables and secrets > Production:

| Name | Type | Source |
|---|---|---|
| GRID_MANAGER_CLIENT_ID | Secret | Authorised provider-issued client ID, same account tested locally |
| GRID_MANAGER_CLIENT_SECRET | Secret | Authorised provider-issued client secret; never document its value |
| GRID_MANAGER_ACCESS_TEAM_DOMAIN | Text | digitalartisans.cloudflareaccess.com (existing Access login hostname) |
| GRID_MANAGER_ACCESS_AUD | Text | Audience tag of the exact production Access application |
| NODE_VERSION | Text | 22.13.0 or newer supported build version |

No VITE_ prefixes. Never pass credentials in browser URLs, JS or case JSON.
UNIT_MAP may be empty: per-reading Metric=mm/Imperial=in are supported. Leave
RSM_FIELD/Bearer token unset for the current spike. Defaults contain API/record URLs.
Save settings and redeploy; Preview uses separate settings and typically a different
Access application/AUD. Do not copy production configuration blindly into previews.
[Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/) explains
server context.env and deployment/environment scope.

## Actual Access Setup and Dashboard Differences

Zero Trust is the account's browser authentication service. Team domain means its
login hostname, not a group of staff or a new domain registration. No Tunnel/WARP
is required. OTP users do not need Cloudflare accounts.

The observed dashboard offers General > Preview access > Restrict previews, not
Enable access policy. That creates a Pages-managed application for
`*.pole-insights.pages.dev`. Its wildcard was non-editable in this account. Do not
keep trying to edit it or treat it as production protection.

A separate self-hosted application was created with destination
`pole-insights.pages.dev`, without wildcard/path. In Zero Trust > Access controls >
Applications, this exact-host application uses the policy named Allow OTP users.
The Pages-managed preview application uses Allow Members - Cloudflare Pages.
The owner reported successful OTP and Grid Manager lookup after configuring these.

For another installation: create a self-hosted application, add the exact public
hostname (custom input if offered), select One-time PIN and an Allow policy for
approved exact emails/company domains. Dashboard menus vary; if the provider does
not accept a pages.dev hostname, use a verified custom domain and separately protect
every supported entry hostname. Never bypass protection to make a query work.
[Access application setup](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

In this observed UI the Application Audience (AUD) Tag is under Additional settings,
not the Details tab. Copy it from the exact-host production application; the UUID
in the dashboard URL is not the AUD. The team hostname is an existing account setting
or visible on the OTP login redirect. Our function verifies Access signature,
issuer, audience and expiry, and rejects missing/invalid sessions before OAuth.

Approved users enter email, receive a one-time code and then use the app during
the configured session. Include Emails ending in permits everyone at those
domains, not selected individuals. Do not allow gmail.com globally; allow specific
Gmail addresses individually. Policy changes affect all applications using the
policy and need no app rebuild. Audit both production and previews independently.

## Security and Account Scope

All authorised integration users currently query the same Field team training
account, using the configured server credentials. Opening the Grid Manager record
requires the user's separate Grid Manager login. No global customer/account choice
is implemented: see P28-TODO-001 for account selection and tenant isolation.

A dashboard screenshot exposed the secret while it was configured as Text.
Treat it as disclosed: request rotation, update local .env.local and Pages Secret,
then redeploy. Encryption now does not invalidate the old exposed value.
The repo/bundle contains no credential values. Access configuration and secrets
are not automatically recreated by a source-code deployment.

## Verification and Troubleshooting

1. Run npm test and npm run build locally; review Cloudflare deployment logs.
2. Use a private window on the exact production URL: expect Access login.
3. Confirm an approved tester can authenticate and an unapproved user cannot.
4. Enable Grid Manager in System preferences, enter CH097081 in the single Asset ID,
   retrieve beside it, then CH096944 for mixed units. Confirm dimensions, grouped
   annotations and new-tab internal-ID record link. Never bundle live record data.
5. Verify A/B focus, saved-case round trip and caller account scope before release.

The function returns 503 for missing Access configuration, 401 for missing/invalid
Access token, and a sanitised upstream error when OAuth/query fails. A successful
OTP page alone does not prove correct AUD or provider credentials. No-match is a
valid result. Nested visual-survey expansion returned HTTP 500 and is omitted by
default; no total length or RSM is fabricated.

Before promotion, rotate the disclosed secret and independently audit allowed
domains, production/preview AUDs and sign-out denial. The owner's success report
does not establish every policy or external account permission has been audited.

For manual deployment from this repo root: build, authenticate Wrangler, then
`npx wrangler pages deploy dist --project-name pole-insights`. Do not deploy only
HTML via dashboard drag-and-drop: Functions must be compiled/included. Retain
staging as a separate optional review project and decide main promotion explicitly.
