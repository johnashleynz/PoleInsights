# Engineering and calculation plan

**Programme scope and acceptance plan, established at P00. The P01 numerical subset and its remaining limits are recorded separately in [P01 review](P01-REVIEW.md); the full programme is not qualified.**

## Coordinates, units and geometry

Use a right-handed world frame: X east, Y north, Z up. Groundline is z = 0; embedment is e; total pole length is L; butt is z = -e; tip is z = L - e. Require L > e > 0 for the embedded-pole case. The horizontal tip force acts toward bearing θ, clockwise from north: Fx = F sin θ, Fy = F cos θ, Fz = 0. Store radians and SI units internally; label the user-facing convention explicitly.

The first geometry is a straight tapered circular pole with optional asymmetric defects. Measured butt, groundline and tip diameters are retained exactly. Use a piecewise-linear diameter profile through three supplied diameters. With two diameters, use their linear taper to estimate the missing one and disclose any extrapolation. With one, require a stated taper assumption from a versioned dataset or an explicitly illustrative value; with none, invite an explicit example selection. Never turn a negative/implausible estimate into a valid result by clamping it. Flag unusual taper for review without silently changing measurements.

Every input records measured / entered / estimated / illustrative status, units and its source where applicable. Keep estimated values recalculable and overridable. Changes to embedment must update diameter stations consistently.

## One physical case, separate representations

Define a versioned case with geometry, material axes, spatial condition/defect fields, foundation model, load cases, input sources and uncertainty. Rendering geometry, section integration, FE meshes and lesson states derive from that case. A visual quality setting must not move a cavity, heal a split or alter pole stiffness.

Material data needs applicable species and grade, moisture/treatment assumptions, density, orthotropic elasticity and relevant tension/compression/shear strengths. Keep characteristic, nominal, mean and design properties distinct. Clear-wood averages are not automatically pole design values. Unknown species/material combinations remain custom illustrative cases until qualified. General material background is available in the [US Forest Service Wood Handbook](https://research.fs.usda.gov/treesearch/62200); this is not a project-specific capacity dataset.

Represent decay as spatial changes to material properties and, where appropriate, material loss. Do not assume stiffness, every strength component and ultrasonic response all decline by one common factor. Retain solid degraded wood before void formation. A knot/grain feature needs local fibre orientation and/or an independently justified assessment method; a knot is not simply an empty circular hole. A split requires an appropriate discontinuity/contact representation before claiming its local strength effect.

## Analysis levels

| Level | Intended result | Limits and requirements |
|---|---|---|
| Analytical reference | Uniform cantilever and section checks | Verification fixture, not the complete product |
| Rapid beam FE | Whole-pole displacement, actions and section-recovered stresses | Tapered beam; asymmetric section integration; declared deformation range and shear formulation |
| Foundation coupling | Embedded-pole response and soil/pole governing mechanisms | Sourced soil response, correct force-per-length units, mesh-independent integration and sufficient depth/boundary treatment |
| Local solid FE | Supported stresses around selected defects | Orthotropic material axes, compatible boundaries, mesh/boundary sensitivity, no overlapping stiffness |
| Nonlinear capacity | First supported limit or progressive collapse within scope | Appropriate geometric/material/soil nonlinearity; history and stability handling; calibrated failure measures |

Beam FE is legitimate FE, but its reconstructed section stress is not a fully resolved 3D solid field. Identify the origin of displayed values. Choose Euler–Bernoulli or Timoshenko assumptions against the required slenderness range and independent benchmarks. Do not prescribe a high-resolution solid mesh everywhere before profiling the simpler qualified model.

Compute remaining-section stiffness by integrating the actual material distribution, including off-centre neutral axes and coupled biaxial bending. Recover signed stresses consistently from the solution. Add shear/torsion assessment only with a defined method and evidence; a net bending section alone does not resolve thin-shell instability or splitting around a cavity.

For soil, the owner requests a credible, inexpensive initial response with **Soft / Medium / Hard** options. Use a small distributed lateral-spring model over the embedded length, with documented depth-dependent stiffness and a justified resistance envelope. Prefer a modest nonlinear force–displacement law if profiling shows useful improvement at little cost. These are representative response presets, not formal geotechnical classifications or site-specific capacities. Hard still permits movement. Do not add continuum soil FE by default.

The general spring approach is consistent with the [FHWA description of p–y modelling](https://www.fhwa.dot.gov/publications/research/infrastructure/structures/04043/08.cfm). That reference also stresses sensitivity to curve selection; its bridge-pile parameters must not be transplanted into short embedded timber poles without justification. Select and document applicable parameters during implementation, checking embedment, diameter, backfill/installation assumptions and the supported displacement range.

Resolve the full horizontal displacement vector without introducing artificial compass-direction dependence for an isotropic preset. Integrate reaction per unit embedded length consistently with the mesh. Check refinement, force/moment balance, increasing-stiffness trends and embedment sensitivity. Do not manufacture restraint by fixing the butt laterally. Keep an ideal fixed-groundline case as a separate benchmark. Initial presets may remain representative while the mechanics are verified; site-specific engineering qualification requires corresponding data.

Add layers, gap/contact, cyclic behaviour or richer soil laws only when an identified use case and reference comparison show worthwhile value at acceptable measured runtime. Record that trade-off rather than assuming complexity improves the product. Self-weight and axial/pre-existing loads need an explicit inclusion/exclusion record, particularly for geometric nonlinearity and climb scenarios.

If local solids replace part of the beam, transfer compatible generalized deformation and work-conjugate forces without counting the replaced stiffness twice. If using one-way submodelling, state its limits and do not silently feed inconsistent stiffness or failure redistribution back into the global solve. No addition of independent stress tensors or utilisation percentages to create a purported total field.

## Capacity, failure load and failure location

For a stated direction and load pattern, seek the lowest load at which a supported limit is reached. A homogeneous linear, no-preload reference case may scale a unit-load result. Nonlinear soil, initial actions, geometry changes and damage require a bracketed incremental solve; handle instability or non-monotonic response rather than assuming a simple scaling or bisection is always valid.

Return the mechanism, section height and angular/material location where meaningful, limiting load bracket, convergence status, reference basis and unassessed competing mechanisms. Distinguish timber bending, tension, compression, shear, instability and foundation rotation/soil failure. Foundation failure is not a snapped timber section.

Report **first limit load** unless a verified, physically validated model actually supports ultimate breakage. A visible break animation can illustrate that limit but must be labelled illustrative. Do not extrapolate linear stresses beyond their range and call the result a fracture simulation. A precise-looking single height is unwarranted where mesh resolution, close competing sections or material variability imply a governing region.

Capacity at zero current load must still be found from the prescribed load pattern rather than dividing by zero. Singular, disconnected or severely deteriorated cases need explicit unsupported/unstable outcomes. Factor-of-safety and code checks require an approved jurisdiction, edition, load basis and resistance factors; no generic green approval state.

Use sensitivity bounds for uncertain diameter, decay extent, material and soil inputs. Label them assumed ranges unless evidence supports statistical confidence intervals. Engineering exports must identify missing mechanisms and whether uncertainty can change the governing result.

## UB1000 and Safe to Climb boundary

Three distinct data types are required: sandbox internal condition, simulated acoustic observations, and recorded/approved device observations. A simulated response is not a UB1000 measurement. The public descriptions establish a conceptual inspection story, not a proprietary signal-to-strength implementation; see the [source register](SOURCES-AND-DATA.md).

Provide an adapter with versioned inputs/outputs for manufacturer-approved algorithms, reference cases or a later authorised service. Record species, geometry, moisture/temperature where required, probe geometry/contact, equipment/calibration identifiers and quality flags according to the approved protocol. Do not invent required device fields or numerical thresholds before that protocol is supplied.

The structural model's internal decay field is known in the sandbox. The inspection interpretation cannot simply read that field and pretend to discover it. A conceptual acoustic model may use it to generate observations; the interpretation stage must operate on its stated measurements and assumptions. Display hidden truth separately from inferred condition and uncertainty. Avoid presenting a single path or plane as exact volumetric tomography.

Safe to Climb needs the actual decision logic, tested operational scope, loading assumptions and permitted wording. Climber weight/position, eccentricity, equipment, existing line loads, environmental conditions and dynamic allowance may be relevant; confirm them against the supplied workflow. Pending those inputs, the lesson can explain hazard screening and incomplete evidence but cannot issue a real clearance verdict.

## Verification and validation

Set final tolerances and reference case definitions before accepting implementation results. The following are proposed starting gates, not accomplished checks:

| Check | Proposed evidence and gate |
|---|---|
| Geometry and units | Measured diameters preserved; full section range; invalid inputs rejected; unit and coordinate round trips |
| Uniform circular cantilever | Independent analytical deflection and section stress within 1% over supported range |
| Biaxial/rotation invariance | Undamaged circular pole invariant under horizontal load rotation; defect orientation transforms consistently |
| Section properties | Independent integration/closed forms for solid, annular and eccentric circular-void sections; less than 1% error on declared quantities |
| Equilibrium and energy | Relative force/moment residual at most 1e-6, with separately justified absolute tolerances; independent reactions and work checks |
| Taper, soil and embedment | Independent compatible reference models and boundary/depth sensitivity; no invented support reactions |
| Solid FE and material axes | Rigid modes, affine strain, constitutive reciprocity/positivity, orthotropic rotation and compatible interface work |
| Mesh and boundary study | At least three levels; target less than 2% change in global quantities and less than 5% in justified local failure measures; report governing-location stability |
| Capacity search | Known linear reference, multiple candidate failure sites, bracket refinement and nonlinear/unstable cases; no false successful result on nonconvergence |
| Solver state | Reversed loads, rapid edits, cancellation, A/B isolation, cold/warm caches and saved-case replay |
| UB1000 | Approved known-input/output fixtures and independent holdout measurements; no performance claim from synthetic cases alone |
| Physical pole behaviour | Measured load–deflection and break-location/capacity comparisons with geometry, defects, species, moisture and restraint documented |
| Decision workflow | Approved Safe to Climb reference cases, boundary/invalid-input cases, permitted outcomes and missing-data handling |

Do not alter tolerances simply to pass a failing case. Separate numerical verification, experimental validation and operational acceptance in reports. Local singular peaks need a physical assessment measure rather than cosmetic averaging. Device-specific detection limits and error rates require the corresponding experimental dataset.

## Responsiveness and adaptive quality

Initial targets for a named reference desktop and phone: visible input response within 100 ms at p95; at least 30 fps during camera/load interaction; common warm beam updates within 200 ms at p95; and common detailed cases within 2 s at p95 after preparation. Record cold preparation separately. Expensive cases may take longer with progress/cancel; none of these figures are current measurements.

Use background workers, complete case/result identifiers, cancellation and stale-result rejection. Start refinement after a proposed 250 ms idle interval. Reuse a factorisation only where geometry, constitutive law, boundary conditions and tangent state make it valid. Keep trial and committed history separate.

Adapt render scale, shadows, post-processing, mesh appearance and frame scheduling from measured frame time, with hysteresis to avoid oscillation. Preserve the analysis geometry. A coarser calculation is an explicit preview and must remain above a verified minimum that resolves the represented defects. Record analysis resolution and convergence separately from the visual quality tier. Stop hidden-view rendering; share immutable geometry where safe, never mutable physical history. Profile peak memory, slow devices, thermal slowdown and two-pole comparison before selecting budgets.
