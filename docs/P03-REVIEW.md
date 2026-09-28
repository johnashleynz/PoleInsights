# P03 — groundline, direct manipulation and timber utilisation

24 September 2026. Local review; no deployment.

## Changes

- Groundline is marked by textured grass with small three-dimensional blades. The nominal patch diameter is 1 m; transparency increases toward its outside edge. Very large poles enlarge that patch just enough to retain clearance around the pole.
- Organic-brown soil is visible immediately below ground and fades to zero at 300 mm depth. These display layers do not shorten the embedded pole or change its distributed soil-spring model.
- The top has a generated photographic-style sawn end-grain texture. A **Pole top** camera shortcut exposes it. Synthetic surface detail is appearance only, not measured geometry or added mechanical defects.
- The section ring has an attached draggable handle and can also be grabbed directly. Dragging follows the projected pole axis, with a fallback for near-plan views. Arrow keys move the handle 50 mm; numeric height and groundline/governing shortcuts remain. The section slider and pole-cut control/state are removed.
- Load direction can be changed by dragging the 3D arrowhead/shaft or its attached load label. The mapping is relative to the loaded tip, with a front-elevation fallback. Arrow keys turn 5 degrees. An enlarged invisible pick surface improves grabbing. A/B linked loads now apply consistently when the inactive pole's arrow is dragged.
- Arrow length grows monotonically with load: display length is `0.35 + 0.6 sqrt(load in kN)` metres. This is a compressed graphic scale, not a linear force ruler; the label states the actual load. A short zero-load direction stub remains usable.
- Stress mode switches between signed longitudinal bending stress (MPa) and local timber utilisation (%). The latter divides stress magnitude by the sign-dependent local strength, including the existing decay-strength reduction. It is not soil utilisation or a factored code check. Shared bounds apply to A and B; values above the legend end are colour-clamped while probes retain actual values.
- Hollow pixels are transparent in the section's stress/utilisation display, with a checker background indicating missing material. Results now separately show timber bending limit, section wood remaining and sampled section peak utilisation, so a soil-controlled overall limit does not conceal timber changes.
- Section dragging moves the section representation without rebuilding the full pole, grass or soil meshes. Texture image sources are isolated so asynchronously loaded grass cannot replace a timber texture.

## Void investigation and verification

The existing beam solver already removed voids from stiffness integration and omitted them from material-strength checks. No cosmetic stress multiplier or new material parameter was added. The solver's limitation remains beam-recovered longitudinal stress, without local three-dimensional stress concentrations, splitting or shell buckling.

The build passes TypeScript, the original 56 numerical checks and **14 additional void/utilisation checks**, 70 in total. [P03 evidence](../verification/results/p03-voids.json) covers full-length annular displacement/stress/capacity, exact remaining area, null stress/utilisation in voids, distinct tension/compression strengths, decay strength, zero load, a local hollow with solid sections above it, and an eccentric void's neutral-axis/directional response. These selected numerical checks do not physically validate damaged poles.

The [hollow verification case](../data/cases/hollow-verification.json) compares two uniform 300 mm poles with an ideal fixed groundline. B has a constant 240 mm diameter central hollow: 36% of the wood area remains, stress under a given moment increases by about 69.4%, and the timber limit decreases from 8.28 to 4.89 kN. The independent reference uses annular section properties, not a second copy of the FE calculation.

## Observed browser checks

- Real pointer drag of the attached section handle changed height from 0.30 m to 3.62 m.
- Real pointer drags on the attached load label and the 3D arrowhead changed bearing from 90 degrees to approximately 333 degrees. An earlier missed shaft attempt orbited the camera; the shaft pick region was enlarged afterward.
- The hollow example rendered distinct A/B utilisation, a transparent hollow section, matching timber limits and 36% remaining wood. Switching to signed stress changed the legend and field. Increasing load from 1 to 9 kN visibly lengthened the arrow and increased stress.
- Groundline close-up showed grass, organic-brown soil fade and the visible embedded pole. The top shortcut showed the photographic-style sawn face. Inspected browser console warnings/errors were empty.
- Section-slider and cut-control absence checked in the DOM. Desktop and narrow preview interaction were exercised; actual mobile touch hardware and exhaustive camera orientations remain unqualified.

## Assets

Generated with the built-in image tool: [grass](../public/textures/grass-p03.png) and [end grain](../public/textures/endgrain-p03.png). [Prompts and provenance](P03-ASSET-PROMPTS.md). No actual pole inspection photograph is claimed. P01/P02 release archives are retained.
