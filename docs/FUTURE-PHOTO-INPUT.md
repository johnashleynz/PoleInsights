# Future deterioration input from scaled photographs

**Owner requirement recorded 24 September 2026. Reserved in the model; tracing and automatic detection are not implemented in P01.**

Users should eventually be able to describe particular deterioration patterns, shapes, locations and extents, including by tracing or reviewing automatic detection on a scaled cross-section photograph.

## Proposed workflow

1. Add a cross-section photograph and identify its pole and height relative to groundline.
2. Establish scale from a known dimension or visible ruler. Record the reference points, units and uncertainty. Confirm the section plane and orientation; correct perspective where justified or reject unsuitable images.
3. Trace the outside boundary and each region. Classify regions explicitly: sound wood, deteriorated wood, missing material, knot or unknown. Permit holes within contours and multiple disconnected regions.
4. Optionally propose contours using image processing. Require review of both the geometry and the classification. Dark pixels, staining, heartwood and shadows are not automatically decay, and a photograph does not measure material strength.
5. Register the accepted contours in the pole's local transverse coordinates in metres, with an orientation reference and height. Preserve the photograph and pixel-to-section registration as evidence, separate from the analysis mesh.
6. Enter longitudinal extent or add measured sections at other heights. A single photograph establishes one plane only. Label any assumed extrusion or interpolation; do not invent measured 3D deterioration.
7. Preview the result in Setup, Innerview and Stresses, inspect the conversion and its uncertainty, then accept it into a versioned case.

## Architecture reserved now

`src/domain/model.ts` includes a `section-contours` shape variant alongside the current ellipse. It reserves physical-coordinate outer boundaries and holes at named heights, provenance, registration, and an explicit distinction between measured stations and assumed longitudinal extrusion. The current `PhotoRegistration` fields cover scale, origin, rotation, plane height, uncertainty and review status. Perspective correction, source-image storage and spatial confidence masks can extend the versioned registration before implementation.

The contour is the physical input, not a mesh. Future section integration, volume reconstruction, rendering and analysis must derive from the same accepted shape. Mesh and texture resolution must not redefine deterioration. Keep raw detections, reviewed contours and derived meshes separately identifiable so corrections and solver revisions can be replayed.

P01 deliberately rejects contour-based imports with an explanatory message. It does not silently substitute an ellipse or issue a result for geometry it cannot yet solve.

## Required checks for the later feature

- Scale and unit accuracy using known shapes; mirrored/rotated images and oblique views.
- Boundary closure, self-intersections, nested holes, overlap, out-of-pole regions and minimum resolvable features.
- Area, centroid and second moments against independent reference geometry, including eccentric and disconnected shapes.
- Consistent appearance and geometry in the section, 3D view and solver.
- Explicit interpolation rules, correspondence between sections and uncertainty in unobserved lengths.
- Manual review and correction of proposed detections; no direct conversion of image darkness into strength or device condition.
- Source-image permissions, private-data handling and portable case packaging.

This feature does not depend on the UB1000 adapter. Photo-derived geometry, actual acoustic observations, inferred condition and synthetic sandbox geometry retain distinct provenance.
