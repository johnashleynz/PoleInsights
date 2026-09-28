# Roadmap and review decisions

**P00 · Draft for discussion · 24 September 2026**

## Staged delivery

| Stage | Concrete deliverable | Acceptance before claiming completion |
|---|---|---|
| P00 — Setup | Separate folder, review prompt, product/engineering plan, lesson storyboards, source/data register | Files present, requirements covered, existing applications preserved |
| P01 — Interaction prototype | Locally runnable branded shell; orbit/pan/zoom; one pole and soil; three view selectors; section; geometry, load direction and A/B state | Real browser interaction and responsive checks; estimates labelled; placeholders unavailable or explicitly illustrative |
| P02 — Verified structural core | Tapered beam FE, asymmetric remaining sections, lightweight Soft / Medium / Hard soil response, independent benchmarks and first-limit search within declared scope | Analytical/independent comparisons; equilibrium, direction, embedment and section checks; worker/cancellation and save/replay checks; representative soil basis disclosed |
| P03 — Foundation qualification and defects | Supported/calibrated foundation scope, defect models and compatible local FE where necessary; richer soil only if worthwhile | Mesh/boundary and embedment sensitivity; independent references; explicit competing mechanisms and limits; measured cost/benefit of any added soil complexity |
| P04 — UB1000 teaching | Probe/measurement sequence, hidden versus inferred condition, product adapter and reference examples | Owner-reviewed technical story; approved device data for quantitative behaviour |
| P05 — Lessons and engineering qualification | Four animated lessons, evidence-rich engineering reports, capacity/uncertainty validation | Verified lesson states; physical validation for claimed scope; approved Safe to Climb cases before real decisions |
| P06 — Website release candidate | Device-adaptive experience, accessible embed/full-page builds, staging acceptance and release evidence | Real devices and host policy checks; asset rights; supported scope reviewed; publication only when requested |

P04 conceptual content and asset work can progress while engineering evidence is being gathered. P05 engineering qualification may be limited to a defined species, defect set and foundation range initially. Record unsupported cases instead of implying universal coverage. P01 visual scaffolding does not fulfil P02–P05.

At each stage provide a numbered local review build, change log, passed/failed/unverified checks and an identifiable return point. Do not borrow the parent's R numbering or overwrite its outputs.

## Proposed defaults to review

| Decision | Proposed starting point | Why it is useful |
|---|---|---|
| Product name | InnerView Insights Pole Laboratory; short UI title Pole Lab | Clear connection to the website and purpose |
| Audience/modes | Explore first, with Lessons and Engineering alongside | Immediate interaction while preserving the full engineering objective |
| First build | P01 interaction prototype, followed by P02 verified calculations | Early review of usability without pre-empting model qualification |
| Geometry | Circular tapered timber; measured butt/groundline/tip stations; signed groundline heights | Matches the requested inputs and arbitrary-height sections |
| Units | Metres, millimetres, kN and MPa; SI inside the model | Consistent local starting point; unit display can expand later |
| Species | Radiata pine first; replaceable, source-linked material datasets | Owner selected the initial species; grade/treatment and engineering properties still need an explicit basis |
| Foundation | Lightweight Soft / Medium / Hard response; fixed-groundline case retained as a benchmark | Owner prefers credible soil behaviour at modest computational cost |
| Rendering | Clean studio scene focused on the pole; photorealistic wood and spatially consistent sawn faces | Owner selected the setting; visual realism stays aligned with defects and arbitrary section height |
| Framework | Independent TypeScript/React/Three.js app and analysis workers | Familiar local patterns without coupling to the Crossarm app |
| Hosting | Full-page lab plus isolated responsive embed, subject to site checks | Allows a focused experience and integration with the existing site |
| Engineering eligibility | Per supported case with approved inputs/evidence | A mode switch cannot make illustrative data suitable for engineering decisions |

Except for the confirmed decisions below, these remain suggestions. None prevents reviewing or revising the brief now.

## Owner-confirmed direction — 24 September 2026

- Name the three views **Setup**, **Innerview** and **Stresses**.
- Start with credible, computationally inexpensive soil response and **Soft / Medium / Hard** options.
- Consider more complex soil methods only if their added value justifies modest computational cost.
- Make the tool engaging and beautiful; visual quality is a first-class acceptance requirement.
- Use a **clean studio scene focused on the pole**, with a simple soil/cutaway element.
- Prioritise **radiata pine** and keep species/material data replaceable.
- The owner authorised an hour of autonomous development, starting at 05:55 UTC on 24 September 2026. P01 and its initial numerical core were developed locally; see the review report for scope and limits.
- Accommodate future deterioration shapes and extents from manually traced or automatically detected scaled cross-section photographs. The input/provenance contract is reserved now; the photo workflow is not implemented.

## The next review conversation

The three highest-value topics are:

1. Confirm the first prototype's visible experience: opening pole, section placement, control density and A/B layout.
2. Choose the first engineering scope: pole species/grade family, assessment jurisdiction and foundation assumptions.
3. Identify the UB1000 and Safe to Climb technical material that can be supplied, including which examples can appear publicly.

Brand assets, hosting details and target devices can be settled alongside early local development. See [Sources and data](SOURCES-AND-DATA.md) for the complete intake list.

## Current delivery status

P02 now names the owner's white/full-height visual review, documented in [P02 visual review](P02-VISUAL-REVIEW.md). The earlier P02 engineering stage above remains a programme objective, not a claim of completed qualification.

- P01 is locally runnable with the studio, three views, sections, A/B, defect controls, soil presets, beam FE and initial lesson walkthroughs. See [P01 review](P01-REVIEW.md).
- Public InnerView product pages researched and the homepage visually inspected.
- Historical handover and later local evidence reviewed with their limits retained.
- This project has its own installed locked dependencies. Typecheck/build and 56 numerical checks pass. Physical engineering validation and product calibration remain open.
- No deployment, remote repository, new Codex task or change to existing application files is part of this setup.

P04 is the owner's leader/transparent-view visual review (docs/P04-REVIEW.md), not completion of the original P04 UB1000 programme objective. The local solid FE milestone remains open.

P05 is the local solid stress preview review, not completion of the original P05 engineering-qualification stage. Its 2% energy-refinement gate remains open; see P05-REVIEW.md.

P06 implements tapered section projection, aligned push/pull loading, crisp grass and phone/A/B framing. Curved outer-boundary research passes its energy gate but is not yet in live results. See P06-REVIEW.md; the full engineering stage remains open.

P07 adds defect-following/live sections, grass context and integrated curved stress previews. The declared cavity benchmark passes mesh refinement and independent checks; controlled boundary sensitivity and solid-based capacity remain open. See P07-REVIEW.md.

## P08 — Owner review update

Completed: larger grass-free sections, centralised end grain and defect materials, Crossarm-style stress surface rendering, collapsible defect editing, source-graded heart/shell rot, working illustrative beam knots, radial inspection drilling, bounded full-resolution section preloading and animated lesson camera/view sequences. See [P08 review](P08-REVIEW.md). The fixed-local-mesh boundary study, physical calibration and supported local knot/bore/graded-decay stresses are still open.

## P09 checkpoint
See P09-REVIEW.md: height charts, sketch input, retained section frames, A/B differences and new local defect solids. Selected three-level studies and fixed-mesh cavity boundary checks pass; broader local boundary qualification and physical calibration remain open.
