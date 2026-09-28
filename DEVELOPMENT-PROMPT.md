# InnerView Insights Pole Laboratory — draft development prompt

**P00 · 24 September 2026 · For review with Carl**

This is the implementation brief. The owner authorised an hour of autonomous local development on 24 September 2026. Supporting specifications are in `docs/`; implemented scope and evidence are recorded in `docs/P01-REVIEW.md`.

---

Develop **InnerView Insights Pole Laboratory**, an intuitive interactive tool for the InnerView Insights website. It should explain how timber utility poles carry load, why and where they fail, how hidden decay affects them, and how UB1000 inspection supports condition and capacity assessment. Retain the useful interaction patterns of the Crossarm lab while giving this project its own InnerView appearance, architecture and verification programme.

Deliver through numbered, reviewable milestones. The intended product serves three purposes: an accessible sandbox, animated teaching, and engineering calculations within an explicitly qualified scope. Keep all three purposes in the programme; do not describe an educational prototype as the completed engineering tool. The owner explicitly prioritises an engaging, beautiful experience: composition, timber materials, lighting, section reveals, responsive interaction and restrained animation are core deliverables.

## 1. Make the pole the centre of the experience

Owner revision P04: replace boxed section/load handles with fine leaders, plain height/load labels and draggable circles. Use a red load arrow. Preview gestures smoothly and commit calculations after release. Use one shared view selector; remove redundant section headings. Reveal defects and internal stress displays through a nearly transparent exterior, use photographic-style sawn sections, depth-occlude the section ring and replace cylindrical soil with a soft spherical segment 1 m across and 300 mm deep. Local solid FE concentrations are a separate verified engineering milestone.

Owner revision P03: grass marks groundline with a nominal 1 m diameter fade; organic-brown soil fades out by 300 mm below ground. Add a realistic sawn top. Use direct on-pole section and arrow dragging, grow the arrow with load, and offer Stress or Utilisation in the Stresses view. Remove the earlier cut-3D-pole option and cross-section slider; exact numeric height remains. Verify void effects and expose the timber limit separately from soil limits.

Owner revision after P01: remove all tan styling, logos and decorative symbols. Use white with a grid, a photographic-style treated-pine exterior and a pole viewport occupying the whole screen height. Move controls into side rails and use plain text actions. This supersedes the warm P01 visual direction.

Show a convincing timber power pole embedded in visible soil, in a **clean studio scene focused on the pole**. Start with **radiata pine**, using replaceable material data with an explicit property basis. Use refined lighting and timber detail, with soil as a simple ground/cutaway element. Users can rotate, pan, zoom, frame a selected feature, reset the camera and enter fullscreen using mouse, touch and keyboard controls. Provide perspective, elevation and plan shortcuts. Let users hide or cut away the soil to inspect the embedded length.

Offer three prominent, immediately understandable views of the same pole:

1. **Setup:** photorealistic timber surface, taper, grain, weathering and the configured defects, with intuitive geometry and loading controls. A section should resemble an actual chainsawed face with end grain, rings, checks, knots and decay appropriate to that location.
2. **Innerview:** cutaway or transparent wood exposing the configured internal decay, from early fibre deterioration to advanced decay and voids. Permit central, eccentric, surface and irregular longitudinal distributions.
3. **Stresses:** results from the supported FE model, with units, signed tension/compression, selectable stress components and a separate utilisation display. Identify beam-recovered and solid FE fields accurately. Display uncertainty and unavailable mechanisms clearly.

A draggable cross-section plane and numeric height control must work anywhere from butt to tip, including below ground. The same Setup / Innerview / Stresses button group controls the section and the main view. Every cut uses the same geometry, defects and result state; it must not be an unrelated stock texture. Provide a jump to the governing section.

## 2. Keep controls simple and effects immediate

Provide a horizontal tip-load slider, direct numeric input, draggable force arrow and a full 0–360° direction control. Label the direction as where the force acts toward. Update the scene immediately; run analysis in the background and make preview, pending, final and failed states understandable.

Pole inputs include total length, embedment, butt diameter, groundline diameter, tip diameter and species. Display the resulting above-ground height. Estimate missing diameters using documented taper rules, retain entered measurements, mark estimates and allow replacement. Reject impossible geometry. Do not silently invent missing engineering material properties.

Allow placement, movement, sizing, rotation, duplication and removal of knots, grain deviation, checks/splits, holes/notches and decay regions where supported. Start with useful presets plus simple handles; expose detailed controls on demand. Defects must affect the appropriate model, or explicitly state that their mechanical influence is not yet assessed.

Reserve a future input route for specific deterioration patterns from scaled cross-section photographs, using manual tracing or reviewed automatic detection. Store registered contours, height, physical dimensions, provenance and uncertainty independently of display/analysis meshes. Distinguish a measured plane from assumed deterioration between planes. Tracing and detection need not be implemented in the first build; see `docs/FUTURE-PHOTO-INPUT.md`.

Show current load, tip movement, estimated governing load and governing height/mode. Differentiate first limit reached, ultimate breakage and foundation failure. Provide a result-details drawer containing assumptions, input provenance, supported mechanisms and uncertainty without crowding the main experience.

## 3. Support fair A/B comparison

Users can duplicate a pole into A and B, edit either, copy settings in either direction, swap them and optionally edit both. Offer independently linkable load, camera and section controls. Keep independent physical states and analysis jobs. Show differences in geometry, defect settings, capacity, governing location and tip movement. Stress maps use a shared legend by default. On phones, preserve both states while switching between A and B and showing a compact comparison summary.

## 4. Build a credible engineering model

Use one versioned case definition with explicit units, coordinates, geometry, material data, defects, foundation, loads and provenance. Separate display quality from numerical fidelity.

Begin with verified tapered beam FE and section integration for rapid whole-pole response. Include biaxial bending, asymmetric remaining sections and local material axes as required. Start with a computationally modest soil response offering **Soft / Medium / Hard**, using distributed lateral springs along the embedded length with documented depth dependence and resistance limits. Presets are representative until calibrated; Hard does not mean infinitely rigid. Add complexity only where it delivers a clear improvement at acceptable measured cost. Keep a fixed-groundline cantilever as a verification/reference option, not the normal substitute for soil. Add compatible local solid FE where supported defect mechanisms need it.

Do not double-count material stiffness or combine incompatible stress fields. Derive stresses, deformation, critical location and capacity from consistent solved states. Do not use arbitrary strength multipliers, blanket decay percentages, unconverged point peaks or attractive colours as evidence of failure.

Estimate capacity by tracing the load to the first supported limit, reporting mechanism, location, bracket and uncertainty. Large displacement, progressive damage, fracture, shell instability around cavities and soil failure each require their own supported formulation before claiming ultimate break load. Unsupported mechanisms remain unassessed. Distinguish nominal or characteristic limits from factored design resistance.

Establish engineering eligibility per case and result, based on approved data, verified numerical scope and physical validation. It must not be granted merely by selecting Engineering mode. Provide reproducible exports of inputs, results, model versions, assumptions and evidence references.

## 5. Explain UB1000 accurately

Build an inspection sequence with probe placement, a transverse acoustic pulse, received-signal explanation and inspection heights. Use published InnerView descriptions as the initial conceptual basis and obtain owner-approved technical material for device-specific behaviour.

Keep three things distinct: the internal condition set in the sandbox, a simulated measurement, and what the actual instrument can infer. A teaching animation must not imply that a single ultrasonic test measures an exact 3D decay shape. Do not invent signal thresholds, Remaining Strength Value equations, accuracy claims, probe protocols or Safe to Climb rules.

Provide a versioned integration boundary for approved UB1000 algorithms or reference outputs. Explain the path from measurement through condition interpretation and material/section assessment to capacity, with uncertainties at each step. Retain separate structural and measurement models rather than forcing one to agree with the other.

The Safe to Climb lesson must use the approved workflow, including applicable loading, exclusions and escalation steps. Until that material exists, provide a clearly identified conceptual lesson and withhold any real climb-clearance verdict. This is a specific evidence requirement, not a reason to stop unrelated development.

## 6. Teach through controllable animation

Provide the four requested lessons:

- Factors that govern where poles break.
- How decay influences pole strength.
- How the UB1000 device determines pole capacity.
- How the UB1000 Safe to Climb tool identifies poles that may be hazardous to climb.

Each lesson supports play, pause, scrub, step, restart, captions, reduced motion and an Explore this moment action. Animate live case parameters and validated lesson states; do not play an unrelated video. Return to the lesson without losing the user's sandbox. Label illustrative fracture and slowed acoustic propagation. See `docs/LESSONS.md` for proposed storyboards.

## 7. Adapt quality to the device

Keep calculations outside the UI thread. Cancel superseded jobs, reject stale results and cache only with complete input/model keys. Use a verified rapid preview during editing and refine after a short idle period. The interface must identify differences between preview and final results.

Adapt shadows, pixel ratio, surface detail and animation activity before reducing analysis resolution. Never relax equilibrium tolerances, erase critical defects or omit failure mechanisms silently for speed. If a device cannot complete a qualified solve, say so and offer the supported preview or a cancellable detailed solve. Retain a usable 2D section/results experience when 3D is unavailable.

Benchmark real desktop, tablet and phone devices, including A/B use. Proposed targets are in the engineering plan and are targets, not measured promises.

## 8. Fit the website and preserve existing work

Use the site's restrained burgundy, warm amber, white and neutral palette with clear, compact controls. Confirm official logos, fonts and asset permissions before publication. Keep technical diagnostics in an expandable area.

Develop locally in this folder with independent build settings. Review Crossarm camera, A/B, section and worker patterns before selective reuse; its educational connection calculations do not establish whole-pole validity. Preserve the parent applications and local edits. Evaluate an isolated responsive embed and a full-page laboratory route with the actual site owner; verify loading, content security rules, sizing and fullscreen in staging when available. Do not deploy without the owner requesting it.

## 9. Deliver evidence with each milestone

Follow `docs/ROADMAP-AND-REVIEW.md`. Establish independent analytical/reference comparisons, force and moment balance, material-axis checks, mesh and boundary sensitivity, capacity-search checks and physical validation. Test import/export, rapid input changes, A/B isolation, camera/section interactions and reduced-capability devices.

Each review includes the working local build, change summary, supported scope, measured performance, passing and failing checks, and the remaining evidence gaps. Visual plausibility and agreement between two implementations of the same formula are not sufficient validation.

---

Start the next authorised development task with P01. Record any agreed changes to this prompt and the review decisions before implementation so the brief remains the current source of intent.

## P05 implementation checkpoint

The first enclosed-region local solid preview is implemented; see docs/P05-REVIEW.md. It is one-way, force-driven and opt-in, with failed global-energy refinement and unqualified local failure measures. Curved geometry and boundary/mesh qualification precede solid-based capacity or groundline expansion. Preserve the beam result and clear source/quality labels.

## Owner revision and P06 checkpoint

Use fixed physical scale in the section panel; show the remaining taper back to the butt circumference. Align the load leader with the arrow; push/pull changes force. Grass now has a crisp 1 m diameter edge, superseding its earlier feathering. P06 implements these controls and an isolated curved-element research solver. See docs/P06-REVIEW.md for evidence and the required curved recovery/qualification work before live use.

## Owner revision and P07 checkpoint

When editing a defect, move the section to its centre. Update the section during dragging from available calculations, with pending rendering identified. Show grass beneath above-ground cuts. P07 implements these behaviours and the curved local preview; see docs/P07-REVIEW.md for exact scope. The next qualification task is a boundary-extension study retaining the local defect mesh, then broader supported-case verification and a justified failure measure.

## Owner revision and P08 checkpoint

The owner removed grass from the section view. Keep the larger fixed-scale section, more central (still eccentric) photographic growth rings, photographic cavity/rot/knot appearances and collapsible defect controls. Actions sit at the left of the model for one pole and across the top for comparisons; omit “Your pole” and a single-pole identity label.

P08 implements Crossarm-style sampled stress surfaces instead of intersecting sheets, a 32 MiB exact-height section cache with background preparation, heart/shell/source-graded decay, illustrative grain-angle knot mechanics, and radial inspection drilling. Drilling defaults to 3/8 inch and one-third of the pole DIAMETER, as confirmed by the owner. Lessons use view changes, animated camera moves and a credited official UB1000 photo.

Read docs/P08-REVIEW.md and docs/P08-ASSETS.md. Knots and bores now affect the beam, but solid knot/bore/graded-decay concentrations and failure remain outside the implemented local model. Preserve those eligibility limits and the P07 boundary evidence. The new visual work does not establish physical validation.


## P09 owner revision
Implement height profiles at 1 m increments with four requested directional load/utilisation quantities; hand-sketched pockets editable by dragging; sections 30% larger without white flashes; local knot, drilling and graded-decay solid previews; closed groundline gap; left-pan/right-rotate controls. Current implementation and qualification are in docs/P09-REVIEW.md. Synthetic sketch extrusion is distinct from future measured photo contours.
