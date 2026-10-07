# Pole Insights P28: Cumulative Changes Since P26

Prepared 8 October 2026. Baseline: Carl Rathbone's Pole Laboratory P26,
commit `5c273fe`. Branch: dev. P27 delivered the original request set; P28 denotes
integration and measured-geometry features. Last committed core integration:
197d112. This document and source bundle include subsequent local work; the bundle
manifest records the parent commit and file hashes, not an invented release SHA.

Historical P27 detail and discussion IDs remain in `P27-CHANGELOG.md`. This fresh
record includes every P27 change reference and the later changes for Carl's review.

## P27 Enhancements and Fixes

| Reference | Change Since P26 |
|---|---|
| P27-CHG-001 | Pole Insights product identity and separate dev review line; historical P26 remains intact. |
| P27-CHG-002 | Optional per-case 255-character Asset ID, persistence and safe export filenames. |
| P27-CHG-003 | Global Metric/Imperial input/display across scene, charts, stresses, lengths, forces and moments; SI retained internally. |
| P27-CHG-004 | NZ/AU/US country configuration, regional species, standards labels and editable embedment starting assumptions. |
| P27-CHG-005 | Supplied Goldpine and ANSI class presets/matching; distinguish published minima from derived taper/geometry. |
| P27-CHG-006 | Load application offset below tip drives beam/foundation models; deliberate locked adjustment. |
| P27-CHG-007 | Optional Detect visibility without discarding saved data. P28 makes this a persistent system preference. |
| P27-CHG-008 | Below-ground Detect probe placement to butt with excavation/yard context. |
| P27-CHG-009 | Revised dimensioned UB1000 assembly shared between scene/section: 50 mm body, 180+20 mm body/tip and wave guide placement. |
| P27-CHG-010 | Chipping external section removal, bearing/arc/depth/length and round/faceted downward taper. |
| P27-CHG-011 | Downward inspection drilling 0-45 degrees with spatial bore/section/beam loss. |
| P27-CHG-012 | Opt-in illustrative break seam/fragments at timber critical zone, default 200% threshold. |
| P27-CHG-013 | Recorded break height/force replay; explicitly observed, not automatic calibration. |
| P27-CHG-014 | Heart-rot source severity applied across its prescribed cross-section instead of unintended radial attenuation. |
| P27-CHG-015 | Shell-aligned quadrature prevents shallow shell loss being missed; verified outside-in progression. |
| P27-CHG-016 | Validation, persistence, section/beam/profile calculation and export support for new geometry/settings; old-case defaults. |
| P27-CHG-017 | Isolated staging deploy path and initial Access guidance; active P28 deployment differs and is documented separately. |
| P27-CHG-018 | Windows/Vite runner startup and full build/test workflow. |
| P27-CHG-019 | Asset input styling aligned to Setup controls. |
| P27-CHG-020 | Correct force/height/capacity/section/stress unit labels in Imperial mode. |
| P27-CHG-021 | Explicit units no longer reset by country selection. |
| P27-CHG-022 | Capacity curve distinguished from utilisation colours and soil versus timber limits. |
| P27-CHG-023 | Cross-section pith/growth rings centred on geometry. |
| P27-CHG-024 | UB1000 probes follow loaded centreline rather than detaching during deformation. |
| P27-CHG-025 | Probe-position wording and dimension/context text. |
| P27-CHG-026 | Lock load point slider wording and locked default. |
| P27-CHG-027 | Replace displaced two-piece break presentation with registered intact-pole annotation. |
| P27-CHG-028 | Timber critical/actual break location distinguished from first soil limit. |
| P27-CHG-029 | Chipped cross-section texture/exterior circumference omits removed material. |
| P27-CHG-030 | Correct angled drilling from upward to downward/inward. |
| P27-CHG-031 | Detect section framing/probe reach accommodates longer assembly. |
| P27-CHG-032 | Detect result units and uncalibrated inference qualification wording. |
| P27-CHG-033 | PLS secondary reference attribution and verification disclaimer. |
| P27-CHG-034 | Requirement/regression coverage for units, country, load, defects, Detect, decay and breaks. |
| P27-CHG-035 | Decimal load-node tolerance fixes zero-stress/infinite-capacity unloaded solutions. |

Reference/document additions: Goldpine rows (P27-REF-001), ANSI Table 8 rows
(002), PLS cross-check (003), country metadata (004), README (005), startup guide
(006), Requirements (007), verbatim TODO source (008), model origin (009), staging
deployment (010), material provenance (011), UB1000 dimensions (012), heart-rot
strength considerations (013) and P27 changelog (014). Their source qualifications
and future discussion items are retained, not silently promoted to certified data.

## Post-P27 and P28 Changes

| Reference | Change |
|---|---|
| P28-CHG-001 | Chipping stress/solid meshes use the actual chipped surface, including inward/downward facets; fixes missing shaded zone (997bac8). |
| P28-CHG-002 | InnerView favicon/logo, About branding and copyright footer (022bf6b). |
| P28-CHG-003 | Compact footer, camera extent excludes footer, company links carry Pole Insights UTM source (88c6692); logos open new tab. |
| P28-CHG-004 | Persistent System preferences for Detect/Axonic/Grid Manager and recent user-entered profiles. |
| P28-CHG-005 | Axonic custom-scheme launch with profile and encoded canonical Asset ID; profile stored per focused case. |
| P28-CHG-006 | Read-only Grid Manager OAuth/OData adapter for local Vite and Cloudflare Pages Function, exact lookup and internal-ID web record link. |
| P28-CHG-007 | Pole metadata, latest/selectable service request, inspector/tag and raw UB1000 observations retained in case JSON. |
| P28-CHG-008 | Per-reading Metric/Imperial conversion, original values and explicit individual unit corrections; unknown/implausible dimensions withheld. |
| P28-CHG-009 | Immediately applied measured girth/pi stations enter shared section geometry, beam/stress/scene/local-mesh sampling and saved cases. |
| P28-CHG-010 | Access JWT verification with jose, server-only credentials and fail-closed hosted API. Active deployment uses exact production OTP application, separate from previews. |
| P28-CHG-011 | One focused Asset ID replaces separate Axonic/Grid search inputs. Retrieval icon beside ID; collapsible Axonic profile/link below; heading becomes Grid Manager. Pending lookup/source/stations clear when ID changes. |
| P28-CHG-012 | Repeatability labels group by height, show AR range/count, preserve raw observations and hover values, and select section on click. No undocumented average or run pairing. |
| P28-CHG-013 | Height-centred labels where space permits, bounded collision packing and leaders to true projected section; replaces one-way downward stacking. |
| P28-CHG-014 | Compatible unmeasured anchors replace mismatched default ends: supported class taper where matched, otherwise bounded measured-data extrapolation. Equal/single samples declare cylindrical estimate. Measured geometry remains exact. |
| P28-CHG-015 | Estimated dimensions/derived total length/assumed embedment use colour and (est.) provenance, saved JSON and old-import migration; manual edits clear relevant flags. AGL metadata can update length, never highest UB1000 test height. |
| P28-CHG-016 | Browser title drops P27 DEV; About release is P28; saved filename uses P28. P26 historical records remain untouched. |
| P28-CHG-017 | New cumulative changelog, user-story specification/input, production TODO, current Cloudflare/secret-location runbooks and no-media full-source handoff. |

Core integration was committed in 197d112. Follow-up source in the handoff is not
claimed committed or deployed unless accompanied by a later release SHA.

## Validation and Remaining Limits

- Live training examples return inspected records and mixed units. CH097081 has
  five unique heights/18 readings; 980 mm girth gives about 312 mm diameter.
- Repeated tests are valid assessment-tool repeatability evidence. Differing girths
  at one height currently retain first usable geometry with a warning.
- No RSM inference; no conversion from AR to mechanical decay/strength. Existing
  material assumptions still govern computed stresses/capacity.
- Source pole species/class metadata does not silently replace material strengths.
- Nested visual-survey expansion returns upstream 500 and is omitted by default.
- Equal girths cannot establish taper; extrapolated ends are estimates requiring
  review, not recovered measurements. Increasing measured diameters remain visible.
- Account/customer selection and tenant isolation are production TODO, not MVP.
- Local FE capacity, fracture/decay calibration and Safe-to-Climb remain unqualified.
- Verification evidence and handoff instructions are in P28-HANDOFF.md; infrastructure
  policy and credential rotation remain separately managed.
