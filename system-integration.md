# Pole Insights system integration spike

Implemented 7 October 2026. This MVP is local code; it has not been published. The replacement local credentials successfully authenticated to the Field team training account. Asset 165482 returned internal ID 1486580 with no inspections, as confirmed by the owner. Live tests then verified CH097081 (1487805), CH096804 (1487800), CH096945 (1487802) and CH096944 (1487801), including their UB1000 dimensions. The initial credentials returned HTTP 403; the implementation follows the documented OAuth query format.

## Scope and assumptions

- Menu > System preferences contains Enable Detect, Enable Axonic integration and Enable Grid Manager integration. Preferences and up to 12 recently entered Axonic profiles persist in this browser's local storage. Integrations default off. Detect defaults to the first existing pole's legacy Detect setting on first migration. Once created, system preferences govern both poles and are independent of imported case files.
- Each pole stores its own Axonic profile and asset ID. New poles inherit the last entered profile for convenience; existing profiles are preserved. No organisation names are pre-populated. Axonic and imported Grid Manager snapshots survive the existing Save/Open JSON workflow. Credentials and global preferences are not included in exports.
- Axonic links use `axonic://{profile}/{encoded asset ID}`. The operating system handles the link. Axonic must be installed and logged into the matching profile; the browser cannot confirm either condition.
- Grid Manager uses OAuth 2.0 client credentials, as confirmed by Mike and the API documentation. No API secrets are included in browser JavaScript, local storage, saved JSON or Git. Both local and Cloudflare routes are read-only.
- Exact search defaults to CustomerPoleId, Gisid or ObservedPoleId. Duplicate matches are rejected; narrow GRID_MANAGER_ASSET_FIELDS if necessary. Internal Id is kept separate from the business asset ID. The confirmed web-record link uses `https://app.innerviewinsights.com/pole/{poleId}` and opens a new tab for record details and photos. Example: asset 165482 has internal ID 1495480; never substitute 165482 into the record URL.
- Selected SR defaults to the most recent dated inspection. Users can choose an older SR. Undated records sort last. Inspector/tag values are displayed verbatim, including customer-configured tags; no green/red threshold is invented.
- Per the owner's instruction, searching a pole or selecting an SR immediately applies usable dimensions and circumference stations. Existing species, class and material strengths are retained; species/class/year are shown as source metadata. This avoids silently substituting unverified material presets.
- The owner confirmed Grid Manager's pole Height is above-ground height. Height_M is read as metres AGL, or Height_Ft as feet AGL when metres are unavailable. When only AGL height is available, total length becomes AGL plus the current embedment; embedment remains an assumption. Survey `PoleStructureInspectionVisual.Length` with explicit `LengthUnit` is treated as total pole length. If both total length and AGL are available, embedment is their difference, subject to geometry validation. Contradictory/out-of-range dimensions are withheld. The load's offset down from the tip is preserved. The latest survey timestamp and latest available dimensional survey may differ.
- Each usable circumference is converted to diameter with C / pi. Heights use the original AGL datum. Piecewise-linear interpolation connects measured stations with existing butt/ground/tip anchors; a measured station at an anchor overrides that anchor for the shared diameter function. Untested spans and the original anchors remain model assumptions. All scene/section/beam calculations use that same function; measured heights also become scene and beam sampling stations.
- Unsupported dimensions, duplicate test heights, unknown units and nonfinite values such as NaN are withheld with import status. First reading wins at a duplicate height; there is no averaging. At most 64 usable stations are applied per inspection to bound the beam mesh size; additional stations remain in the source table. If an SR has no usable circumference, the existing diameter profile is retained with its original SR provenance. Imported stations can be removed in Setup to return to the entered diameter profile.
- Units are per reading, never a system-wide or user-wide choice. UnitType is a string in OData metadata, but its enumeration is undocumented. Explicit mm, in/inches, m and ft/feet are recognised; numeric or other codes need GRID_MANAGER_UNIT_MAP, which is only a dictionary translating code labels, not an account unit setting. Mixed metric and imperial records in the same SR are supported. No unit is inferred from value magnitude. The supplied screenshot's 300/500-inch heights and 790-inch circumference are not silently reinterpreted as millimetres. Out-of-range circumference/height is rejected for geometry.
- The Units menu on each reading can explicitly correct a misrecorded unit to mm or in. That correction applies to that reading's HeightAgl and PoleCircumference only; it does not change other readings or the source record in Grid Manager. Original raw values/unit and original conversions are retained, and corrections are saved in case JSON. Selecting Recorded restores the original interpretation. Geometry is reapplied immediately after a correction, subject to validation.
- `Ar` is available in metadata. Displayed AR preserves the API number without assuming whether it is a ratio or percentage. The owner elected to leave per-reading RSM unavailable for this spike. It is absent from published metadata; GRID_MANAGER_RSM_FIELD remains empty. The application's displayed RSM may be a server-derived quantity; this spike does not reproduce an unpublished calculation.
- Actual UB1000 observations are labelled on the 3D pole and listed in the source table. They do not become simulated decay, calculated stresses, engineering validation or climb clearance. Click a reading annotation to inspect that height.

## API contract

Primary sources inspected:

- [Grid Manager API documentation](https://api.innerviewtech.com/docs/index.html)
- [OpenAPI schema](https://api.innerviewtech.com/swagger/v1/swagger.json)
- [OData metadata](https://api.innerviewtech.com/$metadata)

The OpenAPI schema omits fields from PoleInspectionUB1000s. OData metadata identifies its base type ServiceRequestUb1000s, with Id, ServiceRequestId, HeightAgl, PoleCircumference, UnitType, Ar, Created and the ServiceRequest navigation. ServiceRequest contains UtcCalendarDateTime, InspectorInitials, PoleTag and PoleStructureInspectionVisual.

1. POST `/oauth/token` with the documented query parameters grant_type=client_credentials, client_id and client_secret. The server caches the opaque token until shortly before expiry. Query URLs containing secrets are never logged by this adapter.
2. GET `/PoleStructures` with an escaped OData exact-match filter and `$top=2`. Apostrophes in asset IDs are doubled, then URLSearchParams encodes the query.
3. Expand PoleInspectionUB1000s -> ServiceRequest for readings and inspector outcomes, and ServiceRequestPoleStructuresCollection -> ServiceRequest for survey links. Live testing showed that adding nested PoleStructureInspectionVisual causes HTTP 500, so that expansion is not requested by default. Survey total length remains unavailable unless the API returns the visual data or a confirmed working GRID_MANAGER_EXPAND override is configured.
4. Group readings by ServiceRequestId, sort SR dates, normalise explicit units and retain only the source metadata required by this UI.

The local browser endpoints are GET `/api/grid-manager/connect` and `/api/grid-manager/pole?assetId=...`. Connection checks authorised read access with `$top=0`. Requests time out after 20 seconds per upstream call. No-match, duplicate-match, expired credentials and unsupported/paginated responses remain explicit errors. This MVP rejects paginated nested history rather than labelling a partial history as latest. GRID_MANAGER_EXPAND can override expansions if the deployment's OData depth policy differs; omitting an expansion makes the corresponding data unavailable.

## Local credential setup

The private [`.env.local`](.env.local) file has been created in `source`; it is already excluded by `.gitignore`. Enter the client ID and secret supplied by Mike:

```dotenv
GRID_MANAGER_CLIENT_ID=your-client-id
GRID_MANAGER_CLIENT_SECRET=your-client-secret
GRID_MANAGER_UNIT_MAP={}
GRID_MANAGER_RSM_FIELD=
```

Live training records confirmed per-reading UnitType labels Metric (millimetres) and Imperial (inches), including both in the same inspection on CH096944. These mappings are now built in; UNIT_MAP can remain empty. It is only needed for additional provider codes or explicit overrides, never as an account-wide unit setting. Keep RSM_FIELD empty until its field is confirmed. Optional settings and defaults are in `.env.example`; an existing GRID_MANAGER_BEARER_TOKEN can replace client credentials.

Restart the development server after editing environment settings. Open Menu > System preferences, enable Grid Manager, then Setup > Grid Manager 2.0 > Connect and search an exact asset ID. Local requests require loopback host 127.0.0.1 and same-origin access. Production preview with plain Vite does not implement the API; use the development server for local API work.

Do not prefix secrets with VITE_; those variables are browser-visible. Keep `.env.local`, `.env`, `.dev.vars` and API credentials out of Git and screenshots. Local settings are read by the Vite server only, using loadEnv.

## Public Cloudflare support

`functions/api/grid-manager/[[path]].ts` provides the same adapter as a Pages Function. The public sandbox remains usable without credentials. The integration refuses requests until server credentials and Cloudflare Access protection are configured.

1. In Cloudflare Pages settings for pole-insights, add encrypted production secrets GRID_MANAGER_CLIENT_ID and GRID_MANAGER_CLIENT_SECRET. Configure UNIT_MAP and any confirmed RSM_FIELD as server variables. Use separate preview credentials if preview deployments need access; leave previews unconfigured otherwise.
2. Create a Cloudflare Access application covering the deployed hostname (or the API path together with a sign-in entry route), restricted to the authorised users of this Grid Manager account. Protect every custom hostname in use. The simplest MVP setup protects the whole app hostname, providing sign-in before Connect.
3. Set GRID_MANAGER_ACCESS_TEAM_DOMAIN to the team's `name.cloudflareaccess.com` hostname and GRID_MANAGER_ACCESS_AUD to the Access application audience tag. The Pages Function verifies the signed Cf-Access-Jwt-Assertion against Access JWKS with jose, including issuer, audience, expiry and RS256 signature. Merely supplying a header does not grant access.
4. Deploy the repository with its functions directory alongside the Vite dist output. Git-integrated Cloudflare Pages picks up this functions directory. Existing static build/output settings remain unchanged. Configure secrets and Access before deployment; do not add these settings to client code.
5. Sign in, enable Grid Manager and connect. Missing Access configuration returns 503; invalid/missing session returns 401. A raw Vite/static server cannot provide this production API.

References: [Cloudflare JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/) and [jose](https://github.com/panva/jose). This is a single configured Grid Manager account shared by authorised Access users, not multi-tenant customer OAuth onboarding. Separate deployments/credentials and Access policies are required for different account scopes in this MVP. User-specific OAuth, token revocation UI, bulk search, complete pagination and direct photo retrieval are future work.

## Verification and remaining evidence

Automated integration checks cover exact OData escaping, OAuth, credential withholding, unit conversion, SR ordering, internal-ID links, malformed/imported snapshots, geometry station interpolation and preserving nonlinear history during metadata edits. Browser checks cover global preferences, Axonic links, imported records, inspection selection, annotation display and JSON round trips. Existing numerical suites and the production build must also pass.

Verification passed: 14 focused integration checks, including mixed Metric/Imperial labels in one inspection. Earlier checks passed TypeScript, existing numerical/review suites, Vite production build and Cloudflare Pages Function compilation. Desktop/mobile browser checks used explicit test responses and covered preferences, per-pole Axonic profiles, exact search, automatic dimensions, per-reading corrections, SR selection, annotations, save/open JSON and persistence. Live lookup and dimension application succeeded for all four supplied inspected assets: CH097081/CH096804/CH096945 each produced five unique geometry stations, CH096944 eight. The API returned respectively 18/15/14/31 individual readings, all preserved rather than silently aggregated. The owner screenshot's per-height AR summaries differ from individual API readings; no undocumented summary formula is applied. Duplicate-height dimensions follow the existing first-reading policy with a warning. The adapter uses the returned internal ID for record links and does not invent readings when the returned collection is empty.

Visual survey retrieval, the Grid Manager per-height AR aggregation formula, Axonic OS launch and Cloudflare Access login remain unverified. RSM is deliberately unavailable for this spike at the owner's request. No source records or fixture data are bundled into the public app. No deployment is part of this spike.
