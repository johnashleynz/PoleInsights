# Sources, evidence and data intake

Reviewed **24 September 2026**. Public product descriptions below are manufacturer statements, not independent validation. No proprietary calibration, real instrument dataset, Safe to Climb procedure or site credentials were supplied for this setup.

## Public primary sources inspected

| Source | What it supports | What it does not establish |
|---|---|---|
| [InnerView homepage](https://innerviewinsights.com/) | Product context and visual direction; browser inspection of the actual page | Exact approved brand tokens, asset reuse rights or hosting capability |
| [UB1000 asset inspection](https://innerviewinsights.com/solutions/ub1000-asset-inspection-technology/) | Manufacturer describes transverse acoustic testing, signal energy/transmission features, inspection planes and decay assessment | Proprietary inversion, detailed calibration, resolution, uncertainty or an exact 3D decay reconstruction |
| [Inspection process](https://innerviewinsights.com/inspection-process/) | Manufacturer names time of flight and peak energy and describes development using pole-breaking data with Mississippi State University | The actual dataset, equations, test protocols, independent error assessment or current product limits |
| [Solutions](https://innerviewinsights.com/solutions/) | Manufacturer describes Remaining Strength Value and the link between condition and structural assessment | RSV definition/formula, reference basis, design factors or Safe to Climb rules |
| [US Forest Service Wood Handbook, 2021](https://research.fs.usda.gov/treesearch/62200) and [Chapter 5](https://research.fs.usda.gov/treesearch/62244) | General material reference; variability and the relevance of growth features/environment to wood properties | Qualified properties for a particular pole fleet, species/grade/treatment combination or device calibration |
| [FHWA lateral pile analysis and p–y modelling](https://www.fhwa.dot.gov/publications/research/infrastructure/structures/04043/08.cfm) | General distributed nonlinear soil-spring approach and sensitivity to selected curves | Ready-made Soft / Medium / Hard values or validated parameters for short embedded timber utility poles |

The UB1000 product page describes testing from groundline upward; the Solutions page also refers to condition at/below groundline. Confirm actual probe access, sensing coverage and limitations before illustrating underground inspection. Do not resolve this wording difference by inventing an instrument capability.

No Safe to Climb technical rules were found in the pages inspected or the focused public search. That is an evidence gap in this review, not a claim that the procedure does not exist.

The homepage loaded in the in-app browser after the text-fetch service timed out. Visual notes are based on the rendered page, not an assumed theme. No branding files were copied into this project.

## Local references inspected

- [START-HERE.md](../../../START-HERE.md): supplied R48 handover and preservation instructions.
- [FE development prompt](../../FE-DEVELOPMENT-PROMPT.md) and [R48 status](../../docs/fe-programme/R48-STATUS.md).
- [R48 report](../../docs/fe-programme/r48/README.md): historical verification and explicit local-stress/whole-pole gaps.
- [R60 report](../../docs/fe-programme/r60/README.md): later contact-stiffness work; still not a whole-pole qualification.
- [Crossarm interface](../../app/variant-lab.tsx), [analysis hook](../../app/use-analysis.ts) and [section view](../../app/timber-section-view.tsx): A/B, background-job and section interaction references.
- [Conductors README](../../conductor-lab/README.md): precedent for a separate laboratory in this workspace.

The original handover baseline is 38b1d2f. The current checkout at setup is b5f0e3a with pre-existing edits and an R60.2 source label. Do not reset it to the historical handover. No Crossarm test was rerun as part of this document-only setup, and its past checks are not evidence for this new pole model.

## Required owner/manufacturer inputs

| Input | Used for | Work that can proceed meanwhile |
|---|---|---|
| UB1000 manual, current probe protocol, approved diagrams and example traces | Accurate inspection animation and input contract | Clearly labelled conceptual storyboard and interface |
| RSV definition, approved signal/condition/strength relationships or authorised API contract | Product-specific estimates | Structural solver and adapter boundary |
| Calibration/test cases with species, geometry, moisture, decay and measured outcomes | Calibration and independent holdout validation | Analytical and independent numerical verification |
| Safe to Climb procedure, thresholds, factors, exclusions, example decisions and approved wording | Quantitative lesson and any operational decision support | Conceptual hazard-screening lesson |
| Pole/material datasets, intended species/grades/treatments, jurisdiction and assessment standard editions | Engineering presets and factored capacity basis | Custom illustrative data and geometry/solver work |
| Foundation/soil information and experimental restraint definitions | Embedment-sensitive analysis and validation | Explicit ideal-restraint benchmarks and illustrative soil studies |
| Logo/vector assets, brand guide, wood/probe photos or models and permissions | Final visual fidelity and branded delivery | Provisional styling and asset slots |
| Website integration/staging details, supported devices and embed constraints | Hosting and performance acceptance | Local full-page prototype and provisional embed design |

Do not place credentials, personal field records or proprietary bulk datasets into public assets. Agree which derived examples may ship to a public browser. If an algorithm is confidential, review an authorised service boundary rather than putting the confidential implementation in downloadable client code.

## Evidence record format

For each dataset or reference record: ID, title, author/owner, revision/date, source path or URL, licence/access restrictions, units, material/geometry scope, acquisition or test method, calibration use versus holdout use, uncertainty, known exclusions and approval status. Retain original observations separately from transformed data.

Future source-linked claims need page/section references or dataset IDs. Avoid using marketing timing/accuracy statements as numerical acceptance criteria without the underlying evidence.

## P08 additions

Wood Handbook chapter 5, equation 5–2, pages 5–28–5–30 supports the general Hankinson dependence on grain angle. Chosen illustrative ratios E 0.10, tension 0.05 and compression 0.25 with exponent 2 are documented in P08-REVIEW.md; this is not a calibrated knot model or transferred design rule.

The official UB1000 page now supplies an externally referenced probe photo credited to InnerView Insights / PowerNet. Its browser load is verified; no proprietary device algorithm or Safe to Climb decision rule has been supplied. P08-ASSETS.md records the image source and the generated material textures.
# P19 material references

The current regional catalogue, source tables and missing data are documented in [P19-MATERIAL-SOURCES.md](P19-MATERIAL-SOURCES.md). US pole references use ANSI O5.1-2022 as published by NAWPC in August 2024; static testing is covered by ASTM D1036-99(2025). Bending-only references never create direct fibre strengths or qualify local solid failure.
