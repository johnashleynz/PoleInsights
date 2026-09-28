# InnerView Insights Pole Insights

**P27 DEV · based on Carl Rathbone's Pole Laboratory P26**

Run `Start-Pole-Lab.ps1`, or use the workspace-level `START-WINDOWS.cmd`, then open <http://127.0.0.1:5190>. The DEV label distinguishes this requirements build from the accepted P26 baseline.

Five films have been reworked with narration-timed shots and labels, and UB1000/Analyser and Safe2Climb introductions added. See [P26 review](docs/P26-REVIEW.md).

Safe2Climb and Axonic Analyser now open inside the familiar Samsung Galaxy S21 Ultra phone frame in both popup and embedded views. The added workflow banner has been removed at the owner’s request. See [P25 review](docs/P25-REVIEW.md) for transport checks and browser verification.

The Detect drawer now shows a green filtered-amplitude envelope beneath the received signal. See [P24 review](docs/P24-REVIEW.md) for definitions and checks, and [Claude video review brief](docs/CLAUDE-VIDEO-REVIEW.md) for the ready-to-send review instructions.

Detect now opens the existing **Safe2Climb** and **Axonic Analyser** mockups. Their scan controls start and stop the ultrasound animation; closing the app restores ordinary playback. See [P23 review](docs/P23-REVIEW.md) for the integration boundary and checks.

P22 uses the supplied pole standards for density, preparation and species-group references, verifies US values against ANSI Table 1, and keeps material assumptions inside Properties. See [P22 review](docs/P22-REVIEW.md) for implementation, evidence and remaining limits.

P21 adds clipped, textured cavity walls in Setup, closes cavity ends and corrects outer-skin visibility. See [P21 review](docs/P21-REVIEW.md).

P20 applies available species presets immediately, separates New Zealand and Australia, includes NZ European larch, and moves editable properties into a collapsed menu. Species without verified pole data explicitly require entry before changing the model. See [P20 review](docs/P20-REVIEW.md).

P19 adds the narrated **Estimate a pole test load** walkthrough, briefly displayed labels that stay on one side of each shot, and a 20-entry regional species catalogue. Eight entries include scoped published pole references; other species accept known grade/test values with their source. See [P19 review](docs/P19-REVIEW.md) and [material sources](docs/P19-MATERIAL-SOURCES.md). NZ/Australian standard tables remain to be verified before preset values are populated.

P18 replaces the narration with a UK voice and conversational scripts, adds directed zoom/pan/orbit shots and feature labels, and shows estimated pole-top timber capacity in Detect. See [P18 review](docs/P18-REVIEW.md).

P17 added local tensor/fibre stress inspection, preliminary normal-stress screening and history-dependent ground yielding. See [P17 review](docs/P17-REVIEW.md). Solid capacity and UB1000 calibration remain unqualified.

P14 adds MPa assessment values, collapsed wave controls, compact framing and complete stress surfaces. Separately verified soil-yielding research and new knot/decay boundary studies advance the structural programme without changing production capacity. See [P14 review](docs/P14-REVIEW.md) and the [qualification programme](docs/STRUCTURAL-QUALIFICATION-PROGRAMME.md).

P13 renames Test to Detect and adds a looping 2D elastic-wave simulation, a sound-reference signal, playback/scrubbing controls and an enlarged view. Acoustic properties remain illustrative and late-waveform convergence is outstanding. See the [P13 review](docs/P13-REVIEW.md).

P12 adds diameter/circumference entry and a Test tab with a movable, approximately 160 × 60 mm UB1000 probe pair in both views. Assessment values are explicitly uncalibrated placeholders approved for this teaching prototype. See the [P12 review](docs/P12-REVIEW.md).

P11 replaces Analysis with Stress / Utilisation / Capacity (kN), adds an independent specified/worst load direction selector and applies the requested green–blue–yellow–orange–red–purple utilisation scale. See the [P11 review](docs/P11-REVIEW.md) for result meanings, checks and limits.

P10 reorganises the workspace around Setup, Defects and Stresses, with a single Menu, view-specific controls, a load compass, wheel-driven section height and direct selection/movement for all supported defects. See the [P10 review](docs/P10-REVIEW.md).

A white gridded workspace with a full-height pole, plain text controls and a photographic-style treated-pine surface. **Setup / Innerview / Stresses** share the same pole, deterioration and section geometry. See the [P02 visual review](docs/P02-VISUAL-REVIEW.md).

P04 adds plain leader lines with draggable circles, calculation after release, one shared view selector, photographic sections and a soft spherical soil patch. See the [P04 review](docs/P04-REVIEW.md). Qualification of local solid FE stress concentrations remains outstanding.

P05 adds an opt-in quadratic 3D solid preview for one enclosed above-ground decay region or hollow. In **Stresses**, select **Resolve defect in 3D**; an example is available for unsupported starting cases. Local capacity is withheld while mesh/boundary accuracy is qualified. See the [P05 review and evidence](docs/P05-REVIEW.md).

P06 adds a fixed-scale tapered section with the butt circumference, an aligned load leader with push/pull control, crisp grass and improved phone/A/B framing. A separately verified curved-element prototype improves geometry convergence; it is not yet used for live stresses. See [P06 review](docs/P06-REVIEW.md).

P07 makes sections follow defect edits, updates them during dragging, adds grass above ground and section zoom, and connects the curved solid preview to both views. The selected cavity benchmark passes its mesh-refinement checks; boundary/failure qualification remains open. See [P07 review](docs/P07-REVIEW.md).

P08 replaces the flat stress sheets with sampled timber/cavity surfaces, enlarges grass-free sections, adds photographic defect appearances and collapsible controls, and implements illustrative knot mechanics, inspection drilling and source-graded heart/shell rot. Full-resolution sections are prepared in the background with a bounded cache. Lessons now change view and camera, with a credited official UB1000 image. See the [P08 review](docs/P08-REVIEW.md) and [texture assets/prompts](docs/P08-ASSETS.md).

## Open the prototype

- During this review session: [production preview](http://127.0.0.1:5191/) or [development preview](http://127.0.0.1:5190/).
- For later local use, run `Start-Pole-Lab.ps1` in this folder, then visit port 5190 in a browser.
- To rebuild and verify, run `Build-Pole-Lab.ps1` or `node tools/build.mjs`.
- On another machine, install Node 22.13 or later and run `npm ci` first. Dependencies are pinned in this project's own lockfile.

## Try these first

1. Change the load and direction, then orbit or zoom the pole.
2. Select **Innerview**, add decay, and move the section through the region.
3. Select **Stresses** and use **Governing section** to find the first model limit.
4. Open **Compare A / B**; copy a case if desired, then change one pole. Load, camera and section links are optional.
5. Open **Menu → Videos** for four narrated films with chapters, captions and MP4 downloads.

Drag the blue section handle along the pole and push/pull the load arrow to change the force, or drag sideways to turn it. Use **Section detail** for the crisp grass edge and soil fade and **Pole top** for the sawn end. **Stresses** offers Stress (MPa) or Utilisation (%). The former pole-cut control and section slider have been removed. Save/Open retains both cases; results are recalculated on import. Cases are also kept in this browser's local storage. See [P03 review and void evidence](docs/P03-REVIEW.md).

## What the results mean

The calculation contains a biaxial tapered beam FE model, remaining-section integration and distributed elastic soil springs. Load-only changes scale its linear solution immediately. **413 numerical/software checks pass** through P18; see the numbered reviews for their scope and limits. Full acoustic waveform convergence and physical calibration remain outstanding.

The material, decay and soil parameters remain illustrative. The displayed first model limit is not ultimate breakage, a factored design capacity or climbing clearance. Actual UB1000 calibration and official Safe to Climb decisions are not implemented. Read the [P01 review and evidence limits](docs/P01-REVIEW.md).

## Project documents

- [About this model](Aout%20this%20model.md)
- [Change TODO](TODO.md)
- [Development prompt](DEVELOPMENT-PROMPT.md)
- [Product and interface](docs/PRODUCT-BRIEF.md)
- [Engineering plan](docs/ENGINEERING-PLAN.md)
- [Lessons](docs/LESSONS.md)
- [Roadmap and review decisions](docs/ROADMAP-AND-REVIEW.md)
- [Sources and data](docs/SOURCES-AND-DATA.md)
- [Future deterioration tracing from photographs](docs/FUTURE-PHOTO-INPUT.md)

Hand-sketched synthetic defects are available now. Photo registration, detection and measured contour analysis remain future work under the versioned geometry/provenance contract. A single photograph will not be treated as evidence of the entire deterioration length.

## Folder structure

`src/` contains the app and calculation modules; `data/` contains example/data slots; `verification/` contains the numerical suite and results; `dist/` is the production build; `releases/` contains review archives. Serve the build over HTTP because its calculation worker cannot reliably run from a directly opened HTML file.

This project has its own package, dependencies and build settings. The parent Crossarm and Conductors applications are preserved. No website deployment has been performed.


P09 adds the selectable height chart, direct section sketches, a further 30% larger section rail, retained-image scrubbing, shared A/B chart scales, exact bore boundary transfer, and local knot/graded-decay/drilling solids. See [P09 review](docs/P09-REVIEW.md) for passing selected studies and remaining qualification.


