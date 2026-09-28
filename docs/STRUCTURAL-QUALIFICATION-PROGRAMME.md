# Structural qualification programme after P14

25 September 2026. This is the continuation contract for the owner's six requested areas. It records actual remaining work; it is not an announcement that those mechanisms are implemented or validated.

## 1. Qualified solid stresses and capacity

**Available:** curved T10 elasticity, exact point recovery, rotated material axes, beam submodel transfer, equilibrium/work tests, selected cavity/knot/decay/drill mesh checks. P14 adds fixed-local-mesh knot and graded-decay boundary checks; both pass for the recorded five probes.

**Next implementation:** retain all six local stress components, transform them into local fibre axes, and expose each supported component with its own units and basis. Create a per-case qualification record covering geometry, mesh, boundary proximity, material data and assessed mechanism. The current longitudinal ratio is not a multiaxial timber failure criterion. The drill patch must retain its explicit spatial boundary; no blending/addition of incompatible beam and solid tensors.

**Qualification sequence:** independently reproduce complete selected models, then study three mesh levels and fixed local meshes with increasing remote boundary distances. Include eccentricity, taper, defect size, load bearing and competing defects. Keep global force/work gates; require <2% change in global quantities and <5% in declared nonsingular assessment quantities. Drilling needs a fixed-local-mesh boundary study and a defensible rounded-end geometry or fracture assessment of its sharp corner.

**Capacity gate:** define and source the material failure criterion before extrapolating elastic stresses to an elastic first limit. Singular point peaks cannot establish a converged capacity. A whole-pole limit requires a consistent load path, supported mechanisms and validated material inputs. Do not feed one-way submodel stiffness back into the beam or replace its capacity with a favourable peak ratio. Ultimate fracture is separately gated below.

## 2. Validated knot response

**Available:** illustrative prescribed fibre field, rotated elastic tensor and beam Hankinson approximation; selected numerical mesh/boundary checks pass. No knot experiments have been supplied.

**Next implementation:** represent fibre continuity around and through the knot, sound versus loose/dead knot interfaces, and the actual knot orientation through the pole. Compare fibre mapping and stress concentration against an independently implemented solid model. Use separate material-axis tension, compression and shear data rather than treating the knot as a cavity or fitting one blanket strength factor.

**Physical gate:** documented radiata-pine samples/poles with knot geometry, moisture, treatment, density, grain orientation and measured load–deflection/failure data. Separate calibration specimens from holdout validation. Agreement of two solvers validates neither a fibre map nor the failure law. Without this dataset the response must continue to be labelled prescribed/illustrative.

## 3. Splitting

**Available:** no mechanical split discontinuity; a sketched cavity is not a closed crack.

**Next implementation:** a versioned split definition with an explicit surface, orientation and extent; displacement discontinuity across that surface; opening/sliding cohesive response and compressive contact on closure. Start with a prescribed crack path for a bounded mechanism before attempting arbitrary propagation. Carry trial damage separately from committed state.

**Gates:** mode-I and mode-II benchmark specimens, mixed-mode checks, compression closure without interpenetration, fracture-energy balance, mesh/objectivity study, then combined pole/knot/bore cases. Source transverse tensile/shear strengths and fracture energies for the intended timber condition. A crack animation or tensile stress threshold alone is not a split propagation model.

## 4. Thin-wall buckling around hollows

**Available:** remaining section integration and cavity elasticity. Neither assesses wall instability.

**Next implementation:** geometry classification for continuous thin residual shells versus open/eccentric remnants; an orthotropic shell or adequately resolved solid stability model using the compatible prestress. Include pole taper and shell end restraints. First test linear eigenmodes as diagnostics, then geometric imperfections and nonlinear equilibrium paths for load capacity. A hollow pole need not behave like an isotropic metal tube.

**Gates:** independent cylindrical-shell reference, circumferential/axial/through-thickness convergence, stress-resultant equilibrium, boundary sensitivity and imperfection sensitivity. Validate against hollow timber tests before claiming a shell failure load. Do not use a generic wall-thickness/radius cutoff as capacity.

## 5. Nonlinear timber failure

**Available:** elastic beam/solid responses; P14 soil plasticity is a separate mechanism. Timber stresses beyond the first material limit are still elastic extrapolations.

**Next implementation:** a single coherent large-displacement equilibrium formulation with applicable axial actions; sourced orthotropic compression yielding and tensile/shear damage or cohesive fracture. Use energy regularisation to prevent mesh-dependent softening. Resolve equilibrium through load increments and, where necessary, displacement/arc-length control. Preserve history in save/replay and invalidate unit-load scaling.

**Gates:** material-point verification, tangent checks, energy/dissipation balance, elastic and plastic analytical benchmarks, independent nonlinear references, refinement and experimental load–deflection/break-location comparisons. Distinguish first yield, first crack, instability, peak sustained load and complete separation. Solver nonconvergence is not a validated break load.

## 6. Soil yielding

**P14 progress:** a separate coupled biaxial beam/foundation prototype now has circular elastic-perfectly-plastic springs, consistent tangents, committed plastic slip, reversal/unloading and no fixed-butt substitute. The selected monotonic continuum reference passes; see P14-REVIEW.md. This is the first numerical increment, not field calibration or production integration.

**Next implementation:** decide an explicit loading-history interaction for the sandbox, then connect the nonlinear solver through its own worker/result identity. Load-only changes must re-solve; caches must include committed history. Preserve reversible editing and an explicit reset-to-undeformed action. Show residual movement, yielded depth and separate timber versus foundation limits. Keep the existing timber-only height capacity curve independent of a soil envelope, as the owner requested.

**Additional gates:** incremental refinement, combined/reversed directions, independent cyclic reference, force/moment/work balance throughout the path, embedment and taper studies, groundline resolution, soil profile sensitivity, unloading/reloading and failed-step rollback. Replace representative stiffness/resistance with selected source-linked p–y data and field validation for short embedded timber poles. Gap, cyclic degradation and layered soil remain separate features.

**Integration constraint:** the current worst-direction chart relies on two orthogonal linear unit solutions. A history-dependent soil response cannot inherit that superposition. Keep timber-section result semantics explicit and use independent nonlinear direction/load paths where a foundation-dependent quantity is requested.

## Evidence and sequencing

Proceed with soil integration and local stress qualification as bounded milestones. Develop splitting before claiming knot-interface fracture, and establish stability/nonlinear material behaviour before ultimate pole capacity. Each milestone needs its own benchmark inputs, independent reference, failed-study preservation, case eligibility and measured browser performance. The product must never equate a passing numerical check with physical validation.

Data needed for the physical gates: timber species/grade/treatment/moisture data; multiaxial strengths and fracture energies; knot/grain observations; hollow/split pole tests; foundation profiles and restraint tests. No new user approval is required for routine implementation within this programme; these are evidence requirements, not permission gates.

Primary background inspected for this review:

- [US Forest Service Wood Handbook, Chapter 5](https://research.fs.usda.gov/treesearch/62244): directional wood properties, knots and growth features. Clear-wood summaries do not supply a calibrated pole failure model.
- [FHWA lateral pile analyses](https://www.fhwa.dot.gov/publications/research/infrastructure/structures/04043/08.cfm): nonlinear distributed p–y response and comparisons with pile load tests. It does not calibrate the app's Soft/Medium/Hard values or validate the P14 plasticity law.

Reproduction files and measured results live under `verification/`; the current implementation record is [P14-REVIEW.md](P14-REVIEW.md).
