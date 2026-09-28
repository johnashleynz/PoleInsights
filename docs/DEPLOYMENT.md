# Pole Insights staging deployment

The staging target is the isolated Cloudflare Pages project `pole-insights-staging`. Do not attach the InnerView Insights production domain or alter its DNS.

## Prerequisites

1. Authenticate Wrangler with the Cloudflare account that will own staging: `npx wrangler login`.
2. Confirm the email addresses or domains allowed to review the site.
3. In Cloudflare Zero Trust, create an Access application for the staging Pages hostname and an Allow policy using email one-time PIN authentication.

## Deploy

Run `npm run deploy:staging` from this repository root. The command reruns the full test/build gate before uploading `dist/` to `pole-insights-staging`.

Verify the generated `*.pages.dev` URL while signed out, confirm Access blocks anonymous visitors, then sign in with an allowed address and complete the review smoke test. Production deployment and production DNS changes are outside this DEV release.
