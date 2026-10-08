# Pole Insights P28 System Integration

## P28 Update: 8 October 2026

### Optional AR Deconditioning

The per-pole Grid Manager checkbox is off by default. It derives a Deconditioning
profile from the selected inspection's usable AR/height pairs (not other SRs).
Repeated heights use the lowest available AR; raw observations remain intact.
Up to 64 unique heights are used in ascending height order. Unknown/negative AR
or unknown/out-of-pole heights are ignored; values above 100% confer no increase.
Strength factor is AR/100, multiplied by existing fibre-strength factors,
uniformly across the section. Area and elastic modulus are unchanged. Intervals
use smoothstep interpolation, with 0.30 m smooth ends back to sound strength.
This longitudinal spread is assumed, not measured.

The shared condition field feeds capacity/utilisation calculations, including
the beam and height profile. Stress demand at fixed load remains unchanged when
stiffness is unchanged. Pole shading and section tint reveal the assumed zone;
selecting a Deconditioning station shows its effective AR in the section panel.
The checkbox/source data persist in pole JSON, independently of global settings.
Asset ID edits clear readings, heights, imported diameters and the checkbox;
Reset poles restores source-free sound examples. A mismatching source Asset ID
is never used for Deconditioning. Changing SR or correcting reading units
recomputes the profile and structural-history key.

This optional direct AR-to-strength conversion is owner-requested and explicitly
illustrative. It is not a validated structural assessment, decay localisation,
stiffness calibration, RSM calculation or Safe-to-Climb decision. It supersedes
the original spike's no-AR-strength-conversion limitation only when enabled.

Core integration was published in commit 197d112. The owner confirmed Cloudflare
OTP, OAuth and meaningful retrieval. Latest P28 refinements below are local until
committed/deployed. The dated original spike notes following this section are
historical where superseded here. Full current deployment: docs/DEPLOYMENT.md.

- One focused case Asset ID drives Axonic and Grid Manager. Integration sections
  follow basic pole dimensions and start collapsed. Grid Manager has inbound Load
  pole data and outbound Open pole record hyperlink-style actions. Legacy separate Axonic ID
  is normalised to the case ID. ID edits abort lookup and clear previous records
  and stations. Visible diameter inputs remain assumptions until a new import.
- Actual height comes only from pole AGL metadata/explicit survey total length.
  Source AGL/length summaries use selected units. AGL updates the pole even when
  no usable circumference readings exist.
  UB1000 test-zone heights do not establish overall pole height. AGL plus assumed
  embedment gives estimated total length; both explicit lengths give embedment.
- Source species is now matched against catalogue IDs, common/botanical names,
  known aliases and conservative minor spelling differences. Regional matches
  disambiguate names; ambiguous names remain unchanged with a warning. A changed
  species applies its verified published material preset, recorded as an import
  review warning. Same-species imports preserve manual material values. A match
  without verified properties retains the existing species/material. This
  supersedes the original spike's metadata-only species treatment below.
- Measured circumference/pi stations remain exact. Unmeasured anchors are now
  recomputed, rather than joined to unrelated defaults. A supported source class
  scoped to current species/country (or selected class when no source class exists)
  supplies nominal taper using the nearest length row. Measurements anchor that
  taper: these are not claims of published class minima or class compliance.
- Without a class match, a non-increasing least-squares taper is fitted to unique
  measured points. A single/equal-girth sample cannot establish taper and gives
  a declared cylindrical estimate. Groundline inside the sampled span is
  interpolated; outside ends extrapolate from nearest measured end. Estimates
  are bounded to supported diameters, with warnings. Increasing measured values
  are retained with a review warning, never silently smoothed.
- Estimated diameters, derived length and assumed embedment use (est.) and a
  distinct colour. JSON stores geometryEstimates provenance; manual entry clears
  the corresponding flag. Older saved imported cases migrate this end profile
  when opened. Removing stations leaves the visible estimated anchor profile.
- Repeat assessments remain raw rows. Labels group by exact converted height,
  show AR range/count and hover values, with height-aligned centres where room
  permits. Minimal-displacement packing and leaders preserve true-height linkage.
  Matching repeated girths are valid; differing ones warn and use the first usable
  circumference for geometry. No test-run grouping or AR average is invented.
- Current credentials query only Field team training. Global account/customer
  selection and account-scoped authorisation are P28-TODO-001, not delivered.

### Credentials and Access: Locations Only

Local development: repository-root .env.local, ignored by Git, consumed by the
Vite server. Template: .env.example. Never use VITE_ for credentials.
Hosted: Workers & Pages > pole-insights > Settings > Variables and secrets >
Production, GRID_MANAGER_CLIENT_ID/GRID_MANAGER_CLIENT_SECRET as Secret; Access
team-domain and AUD as Text. Preview is configured separately. Redeploy after
runtime-variable changes. Secret rotation must update local and hosted locations.

Zero Trust: production exact-host application pole-insights.pages.dev, with policy
Allow OTP users; separate managed wildcard preview application. AUD was found
under Additional settings in the owner's UI. Existing team hostname is
digitalartisans.cloudflareaccess.com, not a staff group. Source deployment does not
create Access applications/policies or provision provider clients. The server
validates signed Access tokens before provider OAuth. Missing Access config fails
closed. Broad gmail.com permissions should be replaced by exact addresses.
The screenshot-exposed client secret needs provider rotation; no value is stored
in this document, source or handoff. See P28-TODO-006 for audit tasks.

### Live Account Examples

CH097081 maps to 1487805, CH096804 to 1487800, CH096945 to 1487802,
CH096944 to 1487801 (mixed Metric/Imperial). Business 165482 maps to 1486580 in
training and has no inspections; the older 1495480 example was another scope.
Always use returned internal ID, never a hard-coded mapping. RSM stays unavailable;
nested visual-survey expansion returned 500 and is omitted by default.

## Original Spike Record (7 October 2026)

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
- Unsupported dimensions, unknown units and nonfinite values such as NaN are withheld with import status. Repeated assessments are valid and all remain in the source table. Geometry uses one circumference per height: matching repeat dimensions produce no warning; differing circumferences retain the first usable value with an explicit warning, without averaging. Pole annotations group by exact converted height and show AR min/max and total reading count, with individual AR values and model diameter on hover. Clicking a group selects its measured section. Unavailable AR values are excluded from the range but included in the count. Unmeasured butt, groundline and tip remain entered assumptions; the diameter profile interpolates through measured sections and those anchors. At most 64 usable stations are applied per inspection to bound the beam mesh size; additional stations remain in the source table. If an SR has no usable circumference, the existing diameter profile is retained with its original SR provenance. Imported stations can be removed in Setup to return to the entered diameter profile.
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

P28 follow-up (8 October): all 19 focused integration checks and the complete
checked production build passed. Live desktop/mobile browser checks verified the
shared Asset ID, links, no-match handling, stale import reset, five geometry
stations, compatible estimated anchors and manual estimate overrides. Mobile
label placement reserves the camera-control area. These follow-up changes are
local source work, not a claim of a new hosted deployment.

Automated integration checks cover exact OData escaping, OAuth, credential withholding, unit conversion, SR ordering, internal-ID links, malformed/imported snapshots, geometry station interpolation and preserving nonlinear history during metadata edits. Browser checks cover global preferences, Axonic links, imported records, inspection selection, annotation display and JSON round trips. Existing numerical suites and the production build must also pass.

Verification passed: 15 focused integration checks, including mixed Metric/Imperial labels, repeat assessment preservation and grouped annotation ranges. Earlier checks passed TypeScript, existing numerical/review suites, Vite production build and Cloudflare Pages Function compilation. Desktop/mobile browser checks used explicit test responses and covered preferences, per-pole Axonic profiles, exact search, automatic dimensions, per-reading corrections, SR selection, annotations, save/open JSON and persistence. Live lookup and dimension application succeeded for all four supplied inspected assets: CH097081/CH096804/CH096945 each produced five unique geometry stations, CH096944 eight. The API returned respectively 18/15/14/31 individual readings, all preserved rather than silently aggregated. The owner confirmed repeat tests for tool repeatability; no undocumented summary formula is applied. Additional live desktop/mobile browser checks verified five grouped annotations and all 18 source readings for CH097081, and clicking 1.2 m selected a 312 mm cross-section, matching the imported 980 mm circumference. The adapter uses the returned internal ID for record links and does not invent readings when the returned collection is empty.

Visual survey retrieval, the Grid Manager per-height AR aggregation formula, Axonic OS launch and Cloudflare Access login remain unverified. RSM is deliberately unavailable for this spike at the owner's request. No source records or fixture data are bundled into the public app. No deployment is part of this spike.
