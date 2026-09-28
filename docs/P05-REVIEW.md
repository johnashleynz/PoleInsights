# P05 — first local 3D solid stress preview

24 September 2026. Local review only. P04 rollback build/source preserved. No deployment.

## What is available

In **Stresses**, enable **Resolve defect in 3D**. One fully enclosed rounded elliptical decay region or hollow above ground is supported, with at least two local pole diameters of sound wood between the defect and the submodel ends and between its ends and the groundline/tip. The region must leave at least 13% of pole radius as a ligament under the conservative enclosure check. Unsupported cases show the reason; **Try an enclosed hollow** provides a reversible example.

The initial and refined meshes solve actual 3D elasticity in a worker. The main display and section use the recovered longitudinal solid stress near the defect. Two subtle rings bound that display zone (defect extent plus half a diameter at either end). Beam stress remains outside this zone, with no blending or addition of the two fields. The section probe identifies local 3D use. Utilisation is longitudinal demand divided by the existing sign-dependent illustrative local strength; it is not a full multiaxial failure criterion.

The solid result is a **preview with incomplete mesh/boundary qualification**. It does not replace the beam-based capacity, governing location, section maximum or global displacement. Those outputs are explicitly marked as beam results when detailed mode is on. Input/results exports record the solid formulation, mesh and diagnostic-only status. Case loading restores the detailed-view preference and recalculates results.

## Formulation

- Straight-sided ten-node quadratic tetrahedra, with four-point tetrahedral quadrature. A radial shell mesh follows the configured rounded-region surface at vertices. Decay has a solid core; hollows omit it. Shared midside nodes preserve conformity. The surface remains faceted, including the outer circular pole boundary.
- The prescribed profile is the existing case definition: elliptical transverse radius multiplied by sqrt(1-t^6). No alternative cavity shape or cosmetic concentration factor is introduced.
- This first local model is **one-way and force-driven**. The upper cut receives consistent quadratic-face tractions for the horizontal shear and biaxial moment from the tip load. Traction coefficients use the actual polygon section moments, so transferred force and moment are exact for the discrete mesh. The lower cut is restrained; sound-wood buffers reduce its influence. No local stiffness feeds back into the beam, and no independent stresses or percentages are summed.
- All locations are above ground. Embedded defects, surface-breaking loss, constant-ended hollows, multiple regions, knots and splits are explicitly unsupported for this preview. The global beam still supports its previous cases. Foundation solids and coupled beam/solid deformation remain future work.
- Longitudinal E comes from the current illustrative case. Transverse E/E = 0.10, longitudinal G/E = 0.065, longitudinal/transverse Poisson ratio = 0.30, transverse Poisson ratio = 0.35. These are **declared illustrative assumptions**, not measured radiata-pine calibration. Decay scales the elastic matrix by the existing prescribed stiffness factor.
- Sparse, diagonally scaled conjugate gradients with incomplete-Cholesky preconditioning. A shift, if required, changes the preconditioner only, never the physical matrix. Nonconverged/unstable results are withheld. Stress recovery uses the containing element's affine T10 field without nodal averaging or smoothing.
- Unit 1 kN solves permit exact load-only scaling. Direction/geometry changes restart the worker after commit. The P04 drag preview remains local until release; no solid solve is started by pointer movement. Turning detailed mode off cancels its worker. Cached completed results can be reused after view changes; stale keys are withheld.

## Verification

The existing 70 numerical checks remain passing. There are **25 new kernel checks and 7 field checks**, giving 102 automated checks in the build. They cover stiffness symmetry, six rigid modes, affine stress, mesh conformity, exact quadratic bending, force/moment transfer and balance, energy/work, reversal, zero load, unsupported cases, nonconvergence rejection, unaveraged field lookup, missing material, load scaling, sign-dependent utilisation and rigid rotation.

[Kernel evidence](../verification/results/p05-kernel.json), [field evidence](../verification/results/p05-field.json).

An independent NumPy implementation rebuilds the elasticity, tetrahedral gradients, stiffness and dense solve from the raw mesh. It independently integrates tractions using a different triangle quadrature. On the 678-node / 336-element reference case, relative differences are 4.75e-12 in displacement, 1.15e-10 in stress and 3.84e-12 in strain energy. The maximum reference free-force residual is 5.41e-9 N. [Independent evidence](../verification/results/p05-independent.json). Shared raw geometry is deliberate; this comparison verifies the discrete formulation/implementation, not the continuum geometry or physical poles.

### Refinement and remaining failure gate

| Mesh | Nodes | Tetrahedra | Strain energy, unit-load J | Diagnostic centroid peak MPa | Local node runtime |
|---|---:|---:|---:|---:|---:|
| Initial | 2,650 | 1,584 | 16.8809 | 2.9603 | 1.28 s |
| Refined | 5,838 | 3,744 | 16.2255 | 2.9556 | 7.33 s |
| Fine research mesh | 16,434 | 10,944 | 15.7728 | 2.9559 | 48.62 s |

The final energy change is **2.79%, exceeding the planned 2% gate**. Diagnostic centroid peaks are stable in this one example, but that does not establish a converged local failure measure. The fine research mesh is not offered in the interface because its cost and remaining geometry error do not justify automatic use. [Full refinement evidence](../verification/results/p05-refinement.json).

A sound-pole control exposes approximately 9.6% stress bias at one interior probe on the initial mesh, principally from the faceted circular boundary. This is material to interpreting the preview: a difference between the coarse solid and circular beam result is not all a defect concentration. Curved-boundary elements or adequate geometric refinement are the next priority. No tolerance was relaxed to promote this result.

Moving the sound buffer from two to three diameters changed the selected defect-zone stress by approximately 0.56% in the sampled coarse case. This includes remeshing effects and is not an exhaustive boundary qualification. Sound, decayed and hollow controls show distinct solved redistribution and increasing compliance. [Boundary/decay diagnostics](../verification/results/p05-boundaries-and-decay.json).

An initial field test compared separate solves with a tiny trigonometric residual load and without it against a near-machine-precision absolute stress tolerance. The test was corrected to compare identical load vectors. A rotation test originally regenerated differently indexed tetrahedral diagonals; it was corrected to rotate the same discretisation, isolating material/coordinate invariance. Original tight tolerances were retained. Re-meshing a rotated case produced a separately observed 0.0012% energy difference.

## Browser checks

- Unsupported no-defect input shows an explanation and the example action.
- The enclosed-hollow example solved on both initial and refined meshes; the section reports local 3D stress and a probe reported 4.06 MPa compression in the initial example.
- The refined browser example reported 5,838 nodes, 3,744 elements, a 9.1e-10 solver residual and **16.71 s**. This is one observation, not a p95/device guarantee. Worker execution keeps the camera available; detailed accuracy remains opt-in.
- Stress/utilisation switching worked. Dragging the section changed 2.40 m to 2.562 m while retaining the solid field. Increasing load from 2 to 4 kN kept the completed status, using the unit solution without restarting the worker.
- Inspected browser console warnings/errors were empty. Actual mobile hardware, exhaustive A/B solid jobs, long-session memory, held-pointer timing and browser performance percentiles remain unqualified.

## Reproduction

Run **node tools/build.mjs** for typecheck, all 102 checks and the production bundle. Run **python verification/p05/reference.py** with NumPy after the kernel checks for the independent comparison. Run **node --experimental-strip-types verification/p05/refinement.mjs** and **node --experimental-strip-types verification/p05/boundaries.mjs** for the longer studies. Numerical evidence is written under verification/results.

## Method references and next milestone

[COMSOL submodelling example](https://doc.comsol.com/6.4/doc/com.comsol.help.models.mph.shaft_submodeling/shaft_submodeling.html) describes the general distinction between a global model and local concentration analysis; it does not validate this force-driven implementation. [COMSOL coupling guidance](https://www.comsol.com/support/learning-center/article/modeling-structures-by-coupling-structural-mechanics-interfaces-155012) discusses continuity requirements for coupled domains. The current result is explicitly one-way, with no claimed compatible two-way global stiffness.

Next: reduce curved-geometry error, qualify local stress quantities against independent continuum references, control boundary/mesh sensitivity, then consider capacity and groundline/embedded defects. Actual material calibration, knot/grain mechanics, fracture, thin-wall instability, nonlinear foundation behaviour and UB1000/Safe-to-Climb rules remain outside the qualified scope.
