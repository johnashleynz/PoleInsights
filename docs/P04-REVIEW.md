# P04 — leaders, shared views and transparent interiors

24 September 2026. Local visual/interaction review; no deployment. P01–P03 archives remain available.

## Implemented

- Replaced the boxed section/load controls with fine horizontal leaders, plain values above the line and outlined circular drag targets. The section label is signed height relative to groundline. The load leader begins at the red arrow tip and reports kN. Invisible 32 px hit targets improve mouse/touch accessibility without drawing boxes.
- Both the circles and existing 3D pick targets preview the gesture locally. Pointer movement updates only marker/arrow transforms and labels. It does not commit case inputs, restart the analysis worker, rebuild the model, or repaint the detailed section. Release commits once; Escape, pointer cancellation, loss of capture and window blur cancel. A brief “Release to update” label identifies the preview; existing results describe the last committed state. Keyboard steps remain 50 mm and 5 degrees.
- A/B linked section and load changes commit on release. Direction gestures now create a single Undo checkpoint. Leaders reverse near viewport edges; section leaders attach to the corresponding side of the ring.
- One Setup / Innerview / Stresses button group controls both the whole pole and section, including mobile panels. Removed the separate section view selector, redundant section headings and Match view action.
- Setup sections use the same photographic-style sawn end-grain asset as the pole top, overlaid with the configured geometry/defects. The grain is illustrative artwork, not measured internal structure.
- Innerview's exterior and cap are nearly transparent. Stresses uses a nearly transparent shell around two perpendicular longitudinal interior slices sampled from the existing beam FE field. Stress and utilisation retain their existing units, colour bounds and probes. Void cells are omitted; boundary cells with a void corner are conservatively omitted at display resolution. Display slices are not a new solid FE solve.
- The section ring now depth-tests against the opaque Setup pole, so its rear portion disappears behind the timber.
- Grass fades radially to transparency before its nominal 1 m perimeter. Soil uses 32 thin display layers inside a shallow spherical cap, 1 m across at groundline and 300 mm deep, with radial/depth transparency and pole clearance. This replaces the hard cylindrical sides. Large pole diameters still expand the patch enough for clearance. The physical soil spring model and embedded length are unchanged.

## Verification performed

- TypeScript and production build passed. All existing 70 numerical checks passed during this change; the calculation files and worker were not modified.
- Real browser drag: section height 0.30 to 2.60 m; red load circle changed direction from 90 to 336 degrees.
- A/B close-up section drag: 0.35 to approximately 0.545 m, both linked markers and section updated. Keyboard movement changed both linked sections by 50 mm.
- A/B linked load drag changed direction to 343 degrees on both poles. Undo restored 90 degrees.
- Hollow comparison retained 8.28 / 4.89 kN timber limits, 36% remaining material in the hollow pole, transparent hollow pixels, and selectable stress/utilisation. Innerview reveals the prescribed cavity.
- Browser inspection covered narrow 738 px and desktop 1280 px layouts, photographic section, ground close-up, ring occlusion, one view selector, and circular leaders. Inspected console warnings/errors were empty.
- Code review verifies that pointer movement has no calculation/input callback. The browser interface provides complete drag gestures, so the test did not independently instrument a long held gesture or measure p95 frame time. Touch hardware, cancellation gestures and every camera/load combination remain unqualified. Handles intentionally hide when their 3D anchor is off-screen.

## Engineering milestone still outstanding

P04 does not solve local 3D stress concentrations around void ends, notches or knots. The existing beam FE accounts for remaining-section stiffness and longitudinal bending stress, subject to P03's stated limits. A compatible local solid formulation, independent references, mesh/boundary convergence and justified failure quantities remain required before claiming defect-edge stresses or breakage predictions. No invented concentration colours or modified strengths were introduced.

The existing illustrative material/soil basis and restrictions on engineering assessment, UB1000 inference and climbing clearance remain.
