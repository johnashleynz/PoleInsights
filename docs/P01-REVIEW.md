# P01 — first interactive pole laboratory

24 September 2026. Local review prototype produced during the owner's first autonomous development session. This is an early implementation, not completion of the engineering programme. No deployment has been performed.

## What works

- A clean studio with procedural timber, soil, shadows, orbit/pan/zoom, view shortcuts and section focus. Actual proportions are retained; displacement magnification is a separate display setting.
- **Setup, Innerview and Stresses** use the same pole and deterioration definition. Section height spans the full pole, including embedment. Cross-section appearance is selectable independently; the 3D pole can be visually cut at that plane.
- Total length, embedment, butt/groundline/tip diameters, missing-diameter estimation, numeric/sliding horizontal load and 0–360° bearing. Radiata pine is the initial illustrative material.
- Multiple synthetic elliptical decay or hollow regions with axial extent, two radii, offsets, orientation and severity. Knots can be represented visually, with their mechanical influence explicitly unassessed.
- Soft / Medium / Hard distributed soil-spring presets, plus an explicitly ideal fixed-groundline reference case.
- Independent A/B geometry, condition and results; active-model editing; copy and swap; optional shared edits; linkable load, camera and section controls. Hiding/reopening comparison preserves the cases.
- A background beam FE calculation with stale-job rejection. Load-only changes use exact scaling of a cached 1 kN solution, appropriate to the implemented linear model.
- Section stress probing; tip movement; first illustrative timber/soil limit; governing height/mechanism; a governing ring in Stresses; shared fixed stress colour bounds.
- Four play/step lesson walkthroughs. The first two manipulate structural examples. The UB1000 and Safe to Climb lessons are conceptual and make their product-data gaps explicit.
- JSON case/result export, validated import, local case persistence, undo, desktop fullscreen control, responsive phone navigation and a 2D/calculation fallback if WebGL construction fails.
- Reserved registered-contour/photo-input types. Unsupported contours are rejected. See [future photo input](FUTURE-PHOTO-INPUT.md).

## Calculation actually implemented

The solver uses a 3D-positioned, biaxial Euler–Bernoulli beam with two translations and two bending slopes per node. It integrates tapered stiffness with three-point axial quadrature. Circular sections are exact where undamaged; numerical section integration calculates the stiffness-weighted centroid, both second moments and their coupling for deterioration. Stress is recovered from longitudinal strain/curvature and the remaining material.

Soil resistance is an elastic, depth-dependent distributed spring bed along the embedded length; the butt is not laterally fixed in soil mode. Spring forces and moments are integrated consistently. A separate prescribed response envelope provides a **first spring limit**, not ultimate foundation resistance. The spring model does not yield, gap or model cyclic history.

For depth d below ground in metres and diameter D in metres, spring stiffness per length is `k = k0 × (0.25 m + d) × D / 0.32 m`, in N/m². Preset `k0` values are 4, 12 and 36 MN/m³. Prescribed pressure envelopes are `(15 + 60d)`, `(40 + 160d)` and `(80 + 320d)` kPa for Soft, Medium and Hard; multiply by D to obtain reaction per unit length. These are representative teaching parameters, not obtained from a site investigation or qualified timber-pole foundation dataset.

Timber teaching values are E = 8 GPa, tension = 35 MPa and compression = 25 MPa. They do not identify a pole grade, treatment, moisture state, characteristic population or design resistance. Decay severity s reduces longitudinal stiffness by `1 − 0.85s` and the two strengths by `1 − 0.95s`. These are explicit illustrative laws, not UB1000 calibration. Overlapping regions take the strongest local reduction; they are not repeatedly multiplied. Voids remove material. Knots do not change mechanics in P01.

The lower of the sampled timber bending limit and first spring-envelope limit is reported. A zero current load still has a capacity result from the unit load pattern. No fracture simulation or factored design capacity is claimed. Post-limit values are identified as a continued linear response. Soil-limited and timber-limited results are named separately.

## Numerical evidence

[P01 numerical results](../verification/results/p01-numerics.json) records **56 passing checks**. The suite covers independent closed-form uniform-cantilever displacement/stress/capacity, solid/annular/eccentric section properties, horizontal rotation invariance, zero load, independently integrated soil force/moment balance, a nearly rigid pole compared with analytic spring-bed equilibrium, soil-stiffness/embedment trends, selected mesh refinements, exact live load scaling, rotated eccentric geometry, and rejection of unsupported inputs.

The nearly rigid test uses a deliberately high synthetic modulus to approach its rigid-body reference; that value is not used in the application. Its initial lower-modulus trial retained appreciable bending deformation and did not match the rigid assumption. The benchmark was corrected to approach the stated mathematical limit, without changing application properties or acceptance tolerance.

These checks establish the listed numerical comparisons only. They do not establish convergence of every irregular deterioration case, local stress concentrations, fracture, experimentally validated pole strength, field soil response or device accuracy. The peak is sampled, not a proven continuum maximum.

## Browser and performance observations

The local application rendered genuine WebGL in the Codex in-app browser on this Windows environment. Manual interaction checks covered view changes, a decay region and its matching section, section focus, independent A/B editing, case preservation when toggling comparison, load-only response, independent section values and lesson stepping. The 390 × 844 layout was inspected: separate model/settings/section navigation and no horizontal overflow were observed. Desktop side panels scroll independently so the main pole remains visible.

One browser-control click timed out while advancing a lesson. Fresh inspection showed the prior step intact, and a subsequent normal click advanced it; this was not treated as a passing unattended interaction. General long-run input robustness still needs broader checks.

The production build also opened the supplied sound/decayed comparison, exported both cases to JSON, and reopened that downloaded JSON through the file chooser. The active case, deterioration, section height and comparison were retained, and results were recalculated. This is one observed browser round-trip, not exhaustive file-format or browser compatibility testing.

Recorded local command-line solves for the undamaged mesh study were in the low tens of milliseconds or less. Browser worker startup and UI/render cost are additional. Load-only updates avoid a new solve. Rendering is scheduled on change; pixel ratio can reduce during slow interaction. These observations are not laptop/phone p95, GPU-memory or thermal-performance qualification. Actual mobile hardware, touch gestures, sustained A/B performance and unsupported-WebGL fallback remain to be tested.

## Important remaining work

1. Engineering material/soil datasets, supported assessment basis and physical validation.
2. Converged local solid FE, grain/knot effects, shear, splitting, thin-wall instability, nonlinear soil/material response and actual failure progression.
3. Manufacturer-approved UB1000 examples, calibration, inference and Safe to Climb rules. The conceptual pulse is not an acoustic wave solver.
4. Photo import, scaling/perspective correction, contour editing/detection and qualified longitudinal reconstruction.
5. Photorealism refinement with approved material references. Current timber and sawn faces are procedural; they are not photographs or inspection evidence.
6. More complete lesson animation, production accessibility audit, real-device performance, broader file compatibility and actual website embed/security-policy checks.

## Reproduce locally

With Node 22.13 or later and the locked dependencies installed:

```powershell
npm ci
node tools/build.mjs
.\Start-Pole-Lab.ps1
```

The build runs TypeScript, numerical checks and Vite. Serve `dist/` over HTTP for the packaged review; opening `index.html` directly from the filesystem is not supported because the calculation uses a worker module. The project has its own package and lockfile and does not require changes to the Crossarm or Conductors source.
