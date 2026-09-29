# Considerations for Impact of Heart Rot Decay on Pole Strength

## Purpose

This note records why a central heart-rot defect may produce a relatively small and localised change in the displayed bending-capacity profile, and what evidence is required before treating that response as physically representative of an in-service softwood pole.

The present model is mathematically consistent with its stated assumptions, but its decay severity relationships are illustrative. They have not been calibrated from UB1000 observations or full-scale pole tests.

## Geometric Bending Effect

In simple bending, material near the outside of a pole contributes much more to bending stiffness and capacity than material near the neutral axis. For a circular pole with a concentric circular cavity:

```text
Iremaining / Isound = 1 - (r / R)^4
```

where `r` is the cavity radius and `R` is the pole radius. Consequently, removing a substantial central core can have a smaller effect on longitudinal bending capacity than removing a much thinner layer from the outside.

For the reviewed example:

- Pole diameter: approximately 246 mm
- Central heart-rot region: approximately 138 mm by 117 mm
- Approximate bending-inertia reduction if the entire region is treated as an empty elliptical cavity: 6% to 8%, depending on load direction

This modest reduction is mechanically plausible only if the surrounding outer timber is sound and longitudinal bending is the governing failure mechanism.

## Meaning of Severity in the Current Model

The entered severity percentage is not a percentage loss of total pole capacity. At local decay severity `s`, the current illustrative relationships are:

```text
Residual longitudinal stiffness = 1 - 0.85s
Residual tension/compression strength = 1 - 0.95s
```

At 97% severity, the prescribed decayed material therefore retains approximately:

- 17.6% of sound longitudinal stiffness
- 7.9% of sound tension/compression strength

Because a central heart-rot region lies close to the neutral axis, making that material almost ineffective may still cause only a modest reduction in section bending capacity. The sound outer fibres can continue to govern the response.

The percentage should therefore be understood as an assumed local material-degradation input. It is not currently a directly measured percentage of decay, UB1000 result, remaining strength, or pole-capacity loss.

## Why the Display Can Show a Localised Spike

The source-progression option applies maximum severity at the entered source height and reduces it towards zero at both axial ends of the defect. A short defect length therefore produces a narrow change in the capacity or utilisation profile.

This axial envelope is a prescribed spatial assumption, not an established biological decay profile. Uniform progression produces a broader response over the entered defect length. A measured axial condition profile would be preferable where inspection data supports one.

## Important Unmodelled Behaviour

The simple longitudinal beam calculation may not capture:

- weakened transition wood surrounding the visibly decayed core;
- irregular, eccentric or connected decay geometry;
- splitting and crack propagation;
- longitudinal shear failure;
- instability or crushing of a thin remaining shell;
- moisture, treatment, species and grade effects;
- progressive failure and redistribution after initial local damage; or
- interactions with knots, checks, drilling and other defects.

A larger observed strength loss than the geometric cavity calculation predicts may arise from one or more of these mechanisms. It should not be reproduced by increasing an arbitrary severity multiplier without supporting evidence.

## How to Determine Physical Accuracy

Geometry and numerical implementation can be checked analytically. Establishing the material response requires calibration and independent validation:

1. Measure actual defect geometry, including transition wood, eccentricity, shell thickness and axial extent.
2. Characterise local modulus of elasticity and bending/compressive strength for sound, incipient and advanced decay in the relevant species, treatment and moisture ranges.
3. Bend full-scale poles to failure in multiple load directions while recording load, displacement, strain, failure location and failure mode.
4. Fit separate relationships for residual stiffness and residual strength rather than deriving both from one subjective percentage.
5. Retain a separate set of poles for blind validation rather than evaluating the model only against its calibration data.
6. Compare predicted failure load, deformation and failure location, with uncertainty bounds.
7. Introduce nonlinear fracture, shear or shell-instability models only where the observed failure modes require them and suitable validation data exists.

Inspection-device outputs should be correlated with these measured properties and full-scale results. Detection of decay alone does not establish a unique strength reduction.

## Recommended Presentation

Until a calibrated relationship is available, heart-rot results should be presented as bounded illustrative cases:

- **Sound upper bound:** no property reduction.
- **Prescribed degraded core:** use explicitly entered residual stiffness and strength assumptions.
- **Conservative geometric case:** treat the identified heart-rot region as ineffective or void.
- **Calibrated assessment:** enable only when an approved inspection-to-property relationship and applicable validation evidence are available.

The interface should distinguish defect geometry, local material condition and total pole-capacity reduction. These are related quantities, but they are not interchangeable.

## References

- USDA Rural Utilities Service, [Pole Inspection and Maintenance, Bulletin 1730B-121](https://www.rd.usda.gov/media/file/download/uep-bulletin-1730b-121.pdf). The guidance evaluates hollow heart using measured shell thickness and effective section geometry, and cautions that inspection-device results do not always correlate exactly with full-scale bending strength.
- USDA Forest Service, [Strength loss in decayed wood](https://research.fs.usda.gov/download/treesearch/45681.pdf). This review describes substantial and variable mechanical-property losses during decay and states that visual inspection alone cannot quantify strength loss.
- Yang, Jiang, Hse and Shupe, [Strength reduction in slash pine wood caused by decay fungi](https://research.fs.usda.gov/treesearch/33612). The study reports species, fungus and decay-stage effects on modulus of elasticity, modulus of rupture and work to maximum load.
