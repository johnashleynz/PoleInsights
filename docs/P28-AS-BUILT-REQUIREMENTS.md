# Pole Insights P28: As-Built User Stories

Updated 8 October 2026. Baseline: Carl Rathbone's P26, commit `5c273fe`.
P27 delivered the original enhancement list; P28 adds integrations. This is a
retrospective functional specification, not structural qualification evidence.
Original requests remain verbatim in `TODO.md`. The two REQ3 entries map to
FR-003/FR-004; no REQ4 was supplied. Integration input is recorded separately in
`P28-REQUIREMENTS-INPUT.md`. Planned features are in `P28-TODO.md`, not delivered.

## Inherited P26 Product Workflows

| ID | User Story | As-Built Acceptance |
|---|---|---|
| BASE-001 | As an assessor, I want to configure a pole so I can explore its response. | Species/material properties, total length, embedment and butt/ground/tip diameters remain editable; presets and assumptions are distinguished. |
| BASE-002 | As an assessor, I want to vary load and bearing so I can compare directions. | Load compass, deformation, stress/utilisation/capacity views, specified/worst direction and linked section heights refer to the same geometry. |
| BASE-003 | As an assessor, I want defects and section inspection so I can examine damaged timber. | Cavities, hollows, decay, knots and drilling retain editable geometry and applicable section effects; optional local solid preview has documented limits. |
| BASE-004 | As a reviewer, I want comparison and persistence so I do not lose cases. | A/B, undo, save/open JSON and browser persistence remain. One pole is the editing focus; P28 integration edits never apply to both poles implicitly. |
| BASE-005 | As a learner, I want illustrative ultrasound and media so I can explore inspection context. | Detect, probe/wave animation, Analyser/Safe2Climb mockups and existing videos remain separate from recorded measurements. Carl restores his media for the handoff. |

## P27 Delivery

| ID / Source | User Story | Acceptance / Variation | Status |
|---|---|---|---|
| FR-001 / REQ1 | As a user, I want an Asset ID so I can identify a case. | Optional 255-character ID, persistence and filesystem-safe filename; P28 shares it across integrations. | Delivered |
| FR-002 / REQ2 | As a user, I want Metric/Imperial so I can use familiar units. | Global input/display conversion with SI storage/calculation; ft/in, lbf, kpsi and lbf-ft; explicit unit choice survives country changes. | Delivered |
| FR-003 / REQ3 | As an assessor, I want market defaults so setup reflects my country. | NZ/AU/US regions, standards labels, starting units and editable embedment heuristics, not complete code assessment. | Delivered |
| FR-004 / REQ3 | As an assessor, I want class presets and matching so I can start from reference dimensions. | Supplied Goldpine/ANSI tables, supported manual matching and labelled derived taper/embedment. No invented Australian table. | Delivered |
| FR-005 / REQ5 | As a user, I want consistent product branding. | Pole Insights, favicon, company logo, compact copyright footer and new-tab UTM company links. Tab title omits P27 DEV; P28 identifies release metadata. | Delivered/extended |
| FR-006 / REQ6 | As a test operator, I want an adjustable load point so I can represent a breaking rig. | Numeric tip offset and deliberately unlocked slider drive beam/foundation load location; decimal-node tolerance fixes zero-load solutions. | Delivered |
| FR-007 / REQ7 | As a user, I want optional Detect visibility. | P28 System preferences persists the Detect toggle while retaining case data. Recorded Grid Manager readings have their own toggle. | Delivered/globalised |
| FR-008 / REQ8 | As an owner, I want hosted review behind approved login. | GitHub-connected Cloudflare Pages, production Access application and OTP/email policy. Owner reported successful connection/record retrieval; dashboard policy remains separately managed. | Deployed; audit open |
| FR-009 / REQ9 | As an inspector, I want probes below groundline for yard/excavated tests. | Position to butt; labelled context, no claim of ultrasound through soil. | Delivered |
| FR-010 / REQ10 | As an assessor, I want chipped exterior geometry so removed timber affects the model. | Height/length, bearing, arc, depth, round/faceted taper inward/downward; shared section loss and shaded stress surfaces. Local FE capacity unqualified. | Delivered, later shading fix |
| FR-011 / REQ11 | As an assessor, I want angled inspection drilling. | 0-45 degrees downward/inward from horizontal; rendered bore and intersected section/beam loss; solid preview limits retained. | Delivered |
| FR-012 / REQ12 | As a demonstrator, I want an optional break visual. | Off by default; 200% timber-capacity starting trigger, seam/fragments and likely-zone marker on intact loaded geometry. Static annotation replaces requested dramatic two-piece fracture; not a prediction. | Delivered with variation |
| FR-013 / REQ13 | As a post-mortem reviewer, I want recorded break height/force. | Both values override illustrative marker/trigger and are labelled actual; no automatic calibration. | Delivered |

## P28 Delivery

| ID | User Story | Acceptance | Status |
|---|---|---|---|
| FR-014 | As a user, I want remembered global preferences. | Detect/Axonic/Grid Manager toggles and recent profiles persist locally; no credentials in localStorage. | Implemented |
| FR-015 | As a user, I want one focused Asset ID for external records. | One editable field at the top; collapsed Axonic and Grid Manager sections below basic pole dimensions. Grid Manager provides inbound Load pole data and outbound Open pole record links; the latter uses the returned internal ID. ID changes abort lookup and clear previous source/stations; entered dimensions remain assumptions. | Implemented |
| FR-016 | As an Axonic user, I want to launch the actual pole. | axonic://profile/encoded-ID; recent user-entered profiles only, per-pole profile and saved JSON. Installed handler/profile login required; no API existence probe. | Implemented; OS verification open |
| FR-017 | As a Grid Manager user, I want exact lookup. | Server-side OAuth/OData, escaped business ID, explicit no-match/ambiguous/error states, returned internal-ID record link. One configured account, not global account selection. | Live training lookup verified |
| FR-018 | As an inspector, I want SR selection and metadata. | Latest dated SR by default, date/inspector/tag, all raw readings; older SR selection; empty/paginated history explicit. | Implemented; multi-SR fixture-tested |
| FR-019 | As an assessor, I want measured dimensions without conflicting default anchors. | Circumference/pi sets each usable diameter shared by scene, stress, beam and local mesh. Use species-specific class/length nominal tip and estimated butt anchors, interpolate GL through exact readings, and warn/adjust incompatible estimates. ANSI Tables 5/6/8/9; no substitution of unrelated length rows. Without applicable class dimensions use bounded fitted taper; only then do equal/single samples imply a warned cylindrical estimate. Preserve measured stations and warn on conflicts. Mark estimated dimensions and assumed length/embedment (est.); manual edits clear the relevant marker. Grid Manager Height is total length; import applies country embedment heuristic (est.) and derives AGL. Legacy imports migrate once; manual embedment is retained within an import. Test heights remain AGL, never overall length. | Live geometry and regression verified |
| FR-020 | As an inspector, I want correct mixed units. | Metric=mm/Imperial=in per row, explicit corrections preserve originals, unknown/implausible dimensions withheld. Never apply account-wide unit assumptions. | Live mixed units verified |
| FR-021 | As a reviewer, I want repeatability without visual clutter. | One exact-height annotation with AR range/count; raw rows and hover values preserved. Identical repeat girths valid; differing girths warn and retain first usable geometry, no averaging. | Implemented |
| FR-022 | As a user, I want test labels associated with real height. | Exact centre alignment where possible; collision packing minimises displacement and leaders anchor to projected height; click selects section. | Implemented; browser check per release |
| FR-023 | As an inspector, I want record images. | Open Grid Manager record in a new tab using internal ID; separate Grid Manager login may be required. No photo download/storage in this app. | Implemented |
| FR-024 | As a reviewer, I want provenance saved with cases. | JSON stores profile/snapshot/SR/unit corrections/stations, no secrets or global preferences. Legacy separate Axonic IDs normalised to canonical ID. | Implemented |
| FR-025 | As an owner, I want secure hosted integration. | Pages Function verifies Access issuer/audience/signature/expiry and fails closed; encrypted OAuth secrets are server-only. Approved users share the configured training-account scope. | Implemented; owner connected |
| FR-026 | As a maintainer, I want a lightweight handoff. | Cumulative changelog, requirements, runbooks and source ZIP/manifest; omit media binaries, credentials and build/dependency caches. | P28 handoff |
| FR-027 | As a reviewer, I want optional AR-derived Deconditioning for the focused pole. | Off by default; selected SR only, valid per-reading heights/AR, lowest repeat AR at each height, up to 64 stations. AR/100 directly multiplies fibre strength uniformly across the section, not stiffness or area; no strength increase above 100%. Smooth blending between valid soundings and 0.30 m soft ends. NaN/infinite AR labels show NaN, supply no degradation and interrupt interpolation at unknown-only heights; valid repeats remain usable. Pole/section tint, clickable zones and effective AR label; shared beam/section/height-capacity calculations. JSON persists the toggle and source readings. Asset edits and Reset poles clear source heights, AR and the toggle. Clearly labelled uncalibrated illustrative assumption. | Implemented |

## Non-Functional Acceptance and Limits

- NFR-001: Preserve P26; full-source handoff goes in a new directory, not blindly over Carl's edits.
- NFR-002: SI calculations, input validation and backward JSON compatibility are regression-tested.
- NFR-003: No certified Safe-to-Climb, ultimate fracture or validated AR-to-strength inference. Optional direct AR% strength scaling is an explicitly labelled illustrative assumption, not calibration. RSM deliberately unavailable.
- NFR-004: Responsive stable UI, one focus, label-height and stale-import regression checks.
- NFR-005: npm test plus complete npm run build gate; independent hosted smoke tests distinguish reported from automated evidence.
- NFR-006: No secrets in repo/bundle/browser; .env.local and Cloudflare secrets/settings remain separate. Rotate disclosed secrets.
- NFR-007: Explicit defaults, reference provenance and incomplete survey data; dimension estimates are marked and explain their basis. Never silently infer units.
- NFR-008: Multi-account authorisation and tenant isolation are planned, not delivered. A customer dropdown alone is insufficient.
