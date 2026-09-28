# P08 — Defects, surface stresses and a simpler workspace

24 September 2026. Local review only. No deployment.

## Delivered

- Replaced the two intersecting longitudinal stress sheets with result colours on actual curved timber surfaces, cavity walls and the exposed faces of an optional longitudinal reveal. This selectively adapts the Crossarm approach in app/variant-view.tsx: sample the result at geometry vertices, attach vertex colours, and keep the underlying field separate from its presentation. It is surface rendering, not volumetric tomography. Stress and utilisation retain their shared A/B scales.
- The timber exterior remains nearly transparent in Innerview/Stresses. The stress surface uses restrained normal-based shading for depth. Geometry and colour sampling run in a separate worker; stale workers are terminated. Grey samples remain unavailable rather than being replaced with a guessed field.
- Removed grass from the section panel. Enlarged the section, retained physical taper/butt reference, and moved the grain centre closer to the middle. Sawn faces, cavities, decayed wood and knots use photographic-style generated material textures masked to the prescribed geometry. Surface-reaching defects also alter the Setup exterior; enclosed defects stay hidden behind intact timber.
- Added collapsible defect cards and nested position/spread controls. Presets: heart rot, shell rot, incipient decay, cavity, knot and drilling. Defect edits focus the section at the defect centre.
- Removed “Your pole” and the single-pole badge. The actions in the owner's screenshot sit at the left of the model; A/B moves them across the top. A/B selection is available above the mobile model, settings and section. Comparison framing leaves room for the top controls and load arrow.
- Sections render at 512 × 512 during gestures as well as after release. A dedicated worker prepares exact-height cut faces, preloads nearby 10 mm stations, and keeps a 32 MiB LRU cache. The face resolution follows the physical section size and zoom, bounded at 256–1024 pixels. Heights are never silently replaced with a neighbouring cached section. Unprepared heights show “Preparing section…”. Pointer height gestures now commit on a 10 mm increment; numeric heights remain continuous. Geometry, load, result, view and display changes invalidate the cache.
- Lessons now sequence Setup / Innerview / Stresses with one-second camera transitions between whole-pole, detail and elevation views. User interaction cancels a transition; reduced-motion preferences bypass it. These remain interactive walkthroughs, not exported video files.
- The official UB1000 probe photograph loads in the opening inspection/Safe to Climb lesson step, credited to InnerView Insights / PowerNet. It is referenced from the official site and requires network access. No invented UB1000 image or algorithm was added.

## Calculation changes and limits

Beam result version is now beam-p08. The optional solid solver remains solid-p07.

### Knots

Knots are no longer visual-only markers. Within the prescribed knot region, a smooth assumed grain-angle field modifies axial stiffness and separate tensile/compressive strengths used by the beam section integration, stress recovery and first-limit calculation.

The field is theta = theta_max × (1 − q²), where q is normalised distance in the existing elliptical section. Default theta_max = 45 degrees. Hankinson ratios use n = 2, with Q/P = 0.10 for E, 0.05 for tension and 0.25 for compression. These are explicit illustrative selections within the broad ranges in the US Forest Service Wood Handbook, chapter 5, equation 5–2; they are not calibrated radiata-pine knot properties. See [Wood Handbook chapter 5](https://research.fs.usda.gov/download/treesearch/37427.pdf), pages 5–28 to 5–30.

This is an effective beam material approximation, not a 3D fibre-flow solution, knot-interface model or grade/design rule. The local solid solver still rejects knots. Splitting and fracture remain unassessed. A lower local stress inside a soft knot can coexist with higher demand in adjacent timber; the tests do not assume every knot point must have a higher stress.

Related primary research: [Morgado et al., SIMPOLE (2012)](https://bioresources.cnr.ncsu.edu/resources/simpole-simulation-of-wood-poles-mechanical-behaviour/). Its maritime-pine calibration is not transferred to this application.

### Drilling

The owner confirmed one-third of pole DIAMETER. Defaults: radial bore, 3/8 inch (9.525 mm), depth = local diameter / 3. Also offered: 7/16 inch and 1/2 inch. Height, radial bearing and depth are editable. Moving a bore retains its entered physical depth; “Set depth to ⅓ diameter” recalculates it at the new height.

The geometry is a blind cylindrical bore. Its horizontal section is integrated directly over the narrow radial strip, subtracting only surviving timber and avoiding duplicate loss from coincident bores. This prevents the regular polar integration from missing a small hole. A hole at the surface appears in Setup and its interior is shown in Innerview/sections.

The beam includes section loss and stiffness-centroid changes. It does not resolve local bore-edge stress concentration, bore-induced splitting, treatment breach or future moisture/biological consequences. The solid preview rejects drilling.

### Decay and incipient condition

Heart rot occupies the prescribed internal ellipse. Shell rot uses an outer layer with an editable inward penetration; it leaves the central core sound unless the layer reaches it. Uniform severity remains available.

The default source progression is a prescribed spatial law, not a biological growth rate:
- f(v) = max(0, (0.05^(v^n) − 0.05) / 0.95), n defaults to 2.
- Local severity = source severity × f(radial distance) × f(axial distance).
- Distances are normalised to the selected extent; the existing rounded axial shape is retained.
- For shell rot, radial distance runs inward from the surface; for heart rot it runs outward from the ellipse centre.
- Incipient preset source severity is 20%, explicitly a sandbox input rather than a device-derived value or recognised decay classification.

The same severity drives beam stiffness/strength and all visual views. Setup has deliberately subtle early discoloration; Innerview emphasises prescribed condition, including its source/spread; Stresses shows its computed structural effect. The existing illustrative decay property laws remain unchanged. The local solid preview rejects graded/shell decay instead of applying its uniform enclosed-region material model to them.

## Verification

node tools/build.mjs: typecheck, 173 numerical/software checks, production build.
New suite: node --experimental-strip-types verification/p08.mjs.
Evidence: verification/results/p08.json.

The 42 new checks include:
- Drill defaults, containment, blind end, width/height boundaries, invalid depth rejection, area against an independent circular-segment integral, inertia/centroid rotation, duplicate-hole union, beam equilibrium and greater loss for a larger drill.
- Knot Hankinson endpoints, sign-dependent strength, retained wood, changed movement/first timber limit, tensile utilisation, and return to sound response at zero angle.
- Source severity, radial/axial decrease, zero at the boundary, sound shell core, inward decrease, annular shell stiffness against a closed-form reference and load scaling.
- Exact-height cache keys, LRU memory bound, invalidation and stress geometry covering the circumference.

Observed drill centre area loss: 0.000952259977 m², analytical reference 0.000952259919 m² (relative difference about 6.2e-8). No acceptance tolerances were relaxed. An initial test wrongly expected compression-side utilisation at the knot centre always to increase; the test was corrected to check the tensile case and the separate global/stiffness quantities. Node's strip-only parser also exposed a constructor parameter-property incompatibility, corrected without changing cache behaviour.

All 131 previous checks pass. The P07 mesh/boundary evidence remains unchanged: one cavity benchmark passes its mesh checks, but boundary independence is not qualified. P08 does not claim a new solid failure estimate or complete the fixed-local-mesh boundary study.

## Browser acceptance observed

Graphics-enabled in-app browser at 1280 × 800 and 390 × 844:
- Photographic cavity, larger centralised grain, no section grass, direct drill section, knot and shell rot displays checked.
- Moving drilling from 0.30 m to 1.40 m moved the section; changing to 1/2 inch retained that height.
- With the checked taper and existing drill, adding the default knot changed the beam timber limit from 8.14 to 7.79 kN and rounded tip movement from 146 to 147 mm. Adding shell rot reduced the timber limit to 5.81 kN. Soil still governed that example; the first overall limit correctly remained soil-controlled.
- Existing enclosed cavity completed the curved solid solve and supplied both the section and new surfaces. Unsupported new defect types remain visibly outside that solid scope.
- A/B selection, top toolbar, mobile switching, lesson start/step/restore and official image loading checked. The device photo loaded at 1333 × 2000 pixels.
- Mobile section drag 0.40 → 1.66 m painted eight intermediate frames, retained 512-pixel canvas resolution and ended with an exact ready section. The observed final main-thread paint was 8.1 ms, with 24 cached faces using about 19.3 MB. Earlier desktop paints were approximately 9–12 ms. These are individual observations, not FPS/p95 or real-phone benchmarks.
- Checked browser error/warning log was empty.

Unmeasured: actual mobile hardware/thermal behaviour, very large multi-defect fields, prolonged memory runs, sustained drag p95, and a new full import/export UI cycle. Existing schema validation is retained; new metadata round-trips through ordinary JSON exports.

## Remaining engineering work

Retain the local defect mesh while extending remote boundaries; broaden cavity, taper, orientation and material studies; qualify useful failure measures; add supported solid knot/drill/graded-decay formulations where justified. Material/soil calibration, nonlinear failure, splitting/buckling, physical validation, UB1000 inference and official Safe to Climb decisions remain open.

## Preservation and assets

Previous P01–P07 review archives remain. Parent Crossarm/Conductors sources were not edited. Parent tracked-file preservation digest is unchanged:
238E244E51FBFB0DDECD994A10CF27CBD878040E1C270A3C75F6F309C3E4F512

See P08-ASSETS.md for generated texture paths, prompts and official photo attribution.

