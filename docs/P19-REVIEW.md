# P19 — stable film annotations, test-estimate walkthrough and species library

26 September 2026. Local review only; no deployment.

## Changes

- Film labels use fixed shot-side placement, a restrained white badge and a fine feature leader. They fade in and out over about four seconds. The projected pole position never chooses a new label side.
- All four earlier UK-narrated films are re-recorded with the annotation treatment.
- A fifth narrated film, **Estimate a pole test load**, walks through test restraint, material basis, measured dimensions, deterioration, capacity and critical section, direction/uncertainty, and an A/B comparison. Its graphics use the app's actual pole and section canvases and solved values. The explanatory rail uses the app's control names; it is not a recording of cursor clicks.
- The demonstration uses explicitly assumed radiata-pine E = 8 GPa and Fb = 40 MPa. These are example inputs, not measured data or a recommended pole grade. Sound and damaged examples share material and geometry. Captions, chapter navigation and MP4 download are included.
- Setup now offers 20 species/species groups across NZ/Australia, UK and US. Eight entries have scoped, published pole references; other entries need documented user values. Changes are staged until “Apply material”; cancel retains the current pole.
- A source-bearing bending-reference material is distinct from legacy fibre tension/compression properties. Local solid failure ratios remain unassessed when the source supplies only pole Fb.

See [material references and implementation limits](P19-MATERIAL-SOURCES.md) for the source table, editions and the explicit NZ/Australian standard-table gap.

## Verification

The standard TypeScript and numerical regression sequence includes 39 new P19 checks for reference integrity, legacy compatibility, cantilever Fb Z / H, stiffness/capacity separation, bore treatment adjustment, cavity strength loss, shared section/profile criteria, Detect conversion, unassessed local failure and stable timed labels. The walkthrough's critical-section image uses the actual solved critical height; the capacity/direction shots include the app's capacity chart. Full numerical/build and encoded-media results are recorded in `verification/results/`.

The existing 413 checks passed, followed by all 39 P19 checks (452 total). Browser checks confirmed published-material application and recalculation, incomplete-data rejection, cancel restoring the selected species, persistence of documented custom values after reload, and Detect's material-aware MPa conversion. Development inputs were returned to the radiata teaching material; the user's production-origin case was not changed.

Media checks decode all films, check 1280 × 720 H.264 / AAC, duration, audible narration, captions and changing pole imagery. Contact sheets and early/late frame comparisons support visual review; these do not establish a constant rendering frame rate or physical validation.

All five final files passed decoding, audio-level, duration and caption checks, and all 22 chapters passed the changing-pole-image check. Encoded frames at 3 and 8 seconds confirmed brief annotations; the corrected critical-height frame and A/B comparison were visually checked. Durations are approximately 61, 60, 64, 63 and 127 seconds. The fifth movie loaded from the production preview at 127.188 seconds with media readyState 4 and no media or browser-console error. The user's narrow viewport showed all five film choices in the scrollable library.

The parent Crossarm/Conductors application and earlier review ZIPs are preserved. Protected parent digest: `238E244E51FBFB0DDECD994A10CF27CBD878040E1C270A3C75F6F309C3E4F512`. The P19 source/build archives are generated only after final verification.

## Remaining scope

This is a useful bending-limit workflow, not a calibrated prediction of an individual pole's fracture. The current load is at the physical tip; different test load locations and three/four-point fixtures require corresponding analysis. Splitting, wall instability, nonlinear timber fracture, species-specific acoustic calibration and approved climbing decisions remain unqualified. Species textures remain the treated-pine visual material; choosing a species changes mechanics/provenance, not a claimed identification of its appearance.

NZ/Australian species names and strength groups are present, but approved AS 1720.1 / NZS AS 1720.1 grade values have not been populated without a verified basis. The user-data route supports those values when supplied. Published US/UK references also require their stated treatment, source and grade scope; no automatic code factors are applied.

## Suggested next films

1. **Measure the pole well:** diameter versus circumference, taper, missing measurements and how measurement uncertainty changes capacity.
2. **The same decay, a different outcome:** heart rot versus shell rot, eccentric damage and load direction, using matched A/B cases.
3. **From a test result to a better model:** match the cantilever fixture, record moisture/treatment, compare predicted and measured loads, and calibrate with a batch rather than one specimen.
4. **Wood failure or ground movement?** Separate timber bending from soil yielding, unloading and residual movement.
5. **What ultrasound can and cannot tell us:** separate the wave signal, calibrated fibre properties and the structural capacity calculation.
