# P09 — Height profiles, sketching and local defect solids

25 September 2026. Local review build; no deployment.

## Experience

- A height line at 1 m increments replaces the old unlabelled vertical reference. Its chart offers maximum tip load in the best sampled direction, maximum tip load in the applied direction, maximum utilisation in the applied direction, and maximum utilisation over all horizontal directions. The chart itself can be dragged to inspect a height.
- Capacity curves are section timber bending limits, not whole-pole failure loads. Above-range values continue at the plot edge; the selected-height readout retains the numerical value. The strongest direction uses a declared 2° search; the worst utilisation is the sinusoidal envelope of the sampled material points. Two orthogonal unit beam responses span all directions, including the buried soil response. No repeated solid solves run while dragging.
- A/B charts share the quantity and scale. Sound reference copies the edited pole's geometry/load to the other pole and removes its defects; Undo is available. Timber-limit percentage and tip-movement differences are shown independently of soil limits. Critical timber jumps to the timber location, even when soil governs the overall result.
- The section rail is 30% wider on desktop (320 → 416 px; wide screens 350 → 455 px). On phones it uses the available width. It retains the last complete section during an uncached update, marks it as updating, and disables the sketch overlay until the section is ready. It no longer replaces each missed frame with a white/neutral section. Load and bearing changes reuse Setup/Innerview photographic section caches.
- Sketch a cavity or decay pocket directly on the section: draw and release, or click corners and double-click/Enter to finish. Drag an existing sketch to reposition it. Calculations commit after release. The existing collapsible numeric editor remains, including height, axial length, width, depth and rotation. Escape cancels drawing; Undo restores edits.
- Sketches are a distinct synthetic polygon shape, not an ellipse approximation or measured photo contour. Initial length is a stated constant extrusion, normally 0.6 m. Concave outlines retain their notches; self-intersections and malformed inputs are rejected. All views and beam integration consume the same shape. Photo registration and measured-station lofts remain reserved. Arbitrary sketched cavities are not yet supported by the enclosed-cavity solid mesh.
- Left drag pans; right drag rotates. The grass meets the displayed pole at groundline, including visual deflection. The existing crisp 1 m grass edge remains.

## Local FE implementation

The existing curved T10 kernel now integrates spatially varying elasticity at its quadrature points and recovers it at the queried physical point. It does not average nodal stresses or add a beam field to a solid field.

**Knots:** a prescribed fibre-angle field rotates the transversely isotropic elasticity tensor. Normal/shear coupling is retained in the solve and pole-axis stress recovery. Mesh nodes concentrate around the geometric fibre gradients. The beam still uses its existing illustrative effective Hankinson law; the solid is a separate one-way submodel, not a new calibrated knot grade/failure rule.

**Graded decay:** spatial stiffness follows the authoritative decay severity at each quadrature/query point. Heart and shell decay, including source progression, are supported. This is a prescribed condition/property relationship, not biological growth or UB1000 inference. For ground-crossing regions, the local model resolves only the above-ground portion; the buried portion remains a beam/soil result.

**Drilling:** a body-fitted curved T10 mesh surrounds one radial blind cylindrical bore. The pole surface and bore walls are free; remote artificial cuts receive exact Hermite beam displacements/rotations, with the stated Poisson correction. The bore's flat blind-end edge is singular, so its point maximum cannot establish capacity. The local stress display uses this patch only where it exists; other material uses beam stresses. Bore walls and closely spaced surface samples are included in the stress rendering. Multiple bores combined with other defect types still require a further combined-mesh implementation.

Enable **Resolve defect in 3D** in Stresses; select Initial mesh or Refined mesh. Unit-load results scale with load magnitude. Direction/geometry changes trigger a new background solve. Failed, pending and unsupported cases remain identified. Capacity and the height chart stay beam-based; the local utilisation view uses the illustrative pole-axis directional strength basis, not a qualified multi-axial timber failure criterion.

## Numerical verification and retained evidence

The final production build completed with all 214 regression checks passing (41 added in P09). The final drilling force imbalance was 0.0000581 N, moment imbalance 0.0000608 N m, and relative work error 1.01e-12. Desktop and simulated mobile observations are recorded in [the browser review](P09-BROWSER-REVIEW.md).

Reproduce the regression build with `node tools/build.mjs`. The P09 suite is `node --experimental-strip-types verification/p09.mjs`. It adds sketch/area/translation/round-trip checks, analytical height-chart checks, independent tensor-rotation energy comparison, exact cantilever displacement/rotation/curvature transfer, graded-element energy integration, all three local solves, force/moment balance and boundary-work checks.

Run the longer study from scratch with `node --experimental-strip-types verification/p09-studies.mjs`; `--resume` explicitly reuses its saved rows. Evidence is `verification/results/p09-studies.json`. Predeclared refinement gates are 2% in energy and 5% at specified nonsingular stress probes.

| Checked model | Medium → fine energy change | Largest sampled stress change | Outcome |
|---|---:|---:|---|
| Prescribed knot fibre field | 0.0108% | 2.42% | Selected mesh checks pass |
| Source-graded heart decay | 0.000180% | 0.198% | Selected mesh checks pass |
| Blind radial drilling | 0.0211% | 2.16% | Selected mesh checks pass |

The cavity boundary study extends only the remote cuts and preserves every original node/element geometry. Extending from two to three diameters of buffer changes the five checked stresses by at most 0.0114%; the declared 5% gate passes. This resolves the earlier confounded boundary experiment for this benchmark, not for all cavities, tapers or orientations.

Failed/intermediate evidence is preserved in `p09-studies-initial.json` and `p09-studies-before-knot-focus.json`. Initially, drilling used slopes obtained by differentiating linearly interpolated display stations, creating artificial rotation jumps and inconsistent energy. Exact Hermite transfer fixes this, independently checked against a circular cantilever. An exactly representable rigid translation/rotation is removed from prescribed bore motion before solving to reduce cancellation, without changing strain or adding stiffness. Uniform knot meshes initially changed a core probe by 14.1%; geometry-driven mesh concentration reduced the checked change to 2.42%. No acceptance tolerance or material strength was changed to obtain a pass.

Observed Node solve times: knot/graded initial meshes about 12–13 s, refined about 37–41 s, fine study meshes about 122–142 s; bore approximately 5 / 16 / 32 s. These are individual desktop observations, not p95 or phone guarantees. Detailed solves stay off the interaction thread. Fine meshes are study fixtures, not the normal interactive setting.

## Remaining qualification

The implementations and selected numerical studies are complete for this review scope. Broad parameter coverage, independent whole-model references for the new defects, fixed-local-mesh boundary studies for the new knot/graded/bore cases, realistic knot fibre calibration, sharp-edge failure measures, fracture/splitting, physical timber and soil calibration, device-specific UB1000 inference and approved Safe to Climb decisions remain open. No real failure load, engineering design clearance or climb clearance is established by these results.

Constitutive background: [US Forest Service Wood Handbook, chapter 5](https://research.fs.usda.gov/download/treesearch/37427.pdf). The chapter describes directional elasticity and growth-feature effects; its clear-wood averages do not calibrate this pole model. Method context: [COMSOL's submodelling explanation](https://www.comsol.com/blogs/submodeling-how-analyze-local-effects-large-models-2). Neither source validates these selected inputs or numerical implementations.

## Preservation

The work is contained in innerview-pole-lab. Earlier release archives and failed study evidence remain. The parent Crossarm and Conductors applications are preserved. P09 source/build archives are local review artifacts, with no website publication.

The checked parent-file SHA256 aggregate remained `238E244E51FBFB0DDECD994A10CF27CBD878040E1C270A3C75F6F309C3E4F512`. Review archives are `releases/InnerView-Pole-Lab-P09-build.zip` and `releases/InnerView-Pole-Lab-P09-source.zip`; the packaging tool checks ZIP integrity and reports their hashes. Intermediate evidence before rigid-motion removal is also retained in `p09-studies-before-rigid-removal.json`.
