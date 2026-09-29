# Pole Insights P27 Change Log

Date: 29 September 2026
Baseline: Pole Laboratory P26 (`main`, commit `5c273fe`)
Release branch: `dev`
Release status: Development and review build

This document summarises the changes made between Carl Rathbone's Pole Laboratory P26 baseline and the latest Pole Insights P27 development build. Reference IDs are permanent discussion handles for this release.

## Major Changes and Feature Requests

**P27-CHG-001 - Product identity and release separation**
Renamed current user-facing application surfaces from Pole Laboratory to Pole Insights. The build identifies itself as `P27 DEV - P26 base - Local review`. Historical P01-P26 records retain their original names. P26 remains preserved on `main`; P27 development is isolated on `dev`.

**P27-CHG-002 - Asset identification**
Added an Asset ID field of up to 255 characters to each case. Asset IDs persist in saved cases and a filesystem-safe form is included in exported filenames. Existing P26 files remain valid with an empty Asset ID.

**P27-CHG-003 - Global Metric and Imperial display**
Added a global unit selector while retaining SI internally for storage and calculation. Pole lengths, small dimensions, heights, forces, stresses, moments, chart labels, scene annotations, section dimensions and result readouts now follow the explicit unit selection. Imperial display uses feet, inches, lbf, kpsi and lbf-ft conventions appropriate to the current interface.

**P27-CHG-004 - Country configuration**
Added New Zealand, Australia and United States configurations. Each configuration provides starting units, species region, applicable standards text, embedment guidance and available pole classes. Country selection supplies editable defaults; it does not override a subsequently selected unit system or impose an engineering rule.

**P27-CHG-005 - Pole classes and geometry population**
Added selectable New Zealand Goldpine and US ANSI pole classes. Selecting a supported class populates total length, embedment, groundline diameter, tip diameter and a modelled butt diameter. Manually entered geometry can be matched to a supported class range. Published values are distinguished from calculated taper and embedment values.

**P27-CHG-006 - Load application offset**
Replaced groundline-relative "load application height" with "Load application offset", measured downward from the pole tip. The offset is applied to the elastic beam and yielding-foundation calculations. A lockable slider supports deliberate adjustment and relocks after use; the default is locked.

**P27-CHG-007 - Detect and UB1000 visibility control**
Added `Show Detect features`. Turning it off removes the Detect tab and UB1000 references from the active application and relevant video/library surfaces while preserving the underlying case data.

**P27-CHG-008 - Below-ground Detect positioning**
Extended the UB1000 detection-height range below groundline to the pole butt. Negative heights are explicitly described as an excavated-pole or pole-yard simulation, not an ultrasonic measurement through soil. Pointer, keyboard and committed drag paths use the same below-ground range.

**P27-CHG-009 - Dimensionally revised UB1000 probes**
Rebuilt the UB1000 visual assemblies from supplied dimensions: 50 mm body diameter; 180 mm body plus 20 mm metal tip; 55 mm black butt; 110 mm orange mid-section; 10 mm end cap plus curved taper; and a 50 mm wave guide shown 20 mm embedded and 30 mm protruding. Main-scene and section views share these dimensions and maintain contact with the loaded pole geometry.

**P27-CHG-010 - Chipping defect model**
Added chipping as external removal of pole material rather than an internal pipe. Controls cover height, circumferential bearing, affected arc, depth and round/faceted surfaces. The cut feathers from the original circumference at the top to the entered depth at the bottom, creating the requested pencilled-pole taper. Removed material affects beam section integration and section rendering.

**P27-CHG-011 - Downward inspection drilling**
Added drill inclination from horizontal, constrained from level to 45 degrees downward and inward from the pole exterior. The three-dimensional bore, section intersections and beam section loss use the same geometry. Existing horizontal-bore behaviour is retained.

**P27-CHG-012 - Opt-in pole break demonstration**
Added `Show pole break demonstration`, defaulting off. Its illustrative trigger defaults to 200% of the timber capacity limit rather than the potentially lower soil limit. The loaded pole remains geometrically intact so defects, probes, sections and stress visualisations stay registered. A small jagged fracture seam, six frozen wood fragments and a red `Likely break zone` label mark the critical timber section.

**P27-CHG-013 - Recorded break observations**
Added Actual break height and Actual break force. When both are present and break display is enabled, they replace the illustrative trigger and use an `Actual break zone` label. These observations are stored data and do not automatically calibrate the structural model.

**P27-CHG-014 - Heart-rot response correction**
Corrected source-mode heart rot so the entered source severity applies across the prescribed heart-rot cross-section at the source height and diminishes along its entered length. Previously it was also attenuated radially from the neutral axis, making even severe heart rot almost invisible in the height-capacity curve. Height-profile and whole-pole checks now confirm that heart rot reduces stiffness, local chart capacity and timber capacity.

**P27-CHG-015 - Shell-rot response and integration**
Verified the intended outside-in shell progression: maximum severity at the exterior, diminishing towards sound timber at the entered shell depth and axially away from the source. Added shell-aligned radial integration bands so shallow concentric shells cannot fall between production quadrature samples. Regression checks compare production section stiffness with fine integration and confirm reduced local and whole-pole capacity.

**P27-CHG-016 - Structural use of new geometry**
Extended persisted case data, validation, section sampling, beam integration, height profiles and exports for load offset, country, units, pole class, chipping, angled drilling and break observations. P26 case files are normalised with compatible defaults.

**P27-CHG-017 - Isolated staging deployment path**
Added an isolated Cloudflare Pages deployment command for `pole-insights-staging` and documented the required Cloudflare Access email/domain policy. No production deployment, production domain or DNS change is included.

**P27-CHG-018 - Local startup and build workflow**
Added P27 startup guidance and updated local launcher text. The project uses Vite's runner configuration loader on Windows, includes P27 verification in `npm test` and the complete build gate, and can be launched by the workspace-level `START-WINDOWS.cmd` supplied with the handoff.

## Minor Changes and Bug Fixes

**P27-CHG-019 - Asset ID control styling**
Matched the Asset ID text input to the visual treatment and dimensions of the other setup controls.

**P27-CHG-020 - Unit-label corrections**
Corrected pole-tip force, pole height, capacity-tab title, chart-height labels, section diameter and model-response values so Imperial mode displays lbf, feet/inches, inches and kpsi consistently instead of retaining metric labels or values.

**P27-CHG-021 - Unit choice no longer reset by country**
Separated explicit unit selection from country selection. For example, New Zealand can remain selected while all displayed values use Imperial units.

**P27-CHG-022 - Height-chart meaning clarified**
Capacity mode now identifies the curve as section capacity while pole and section colours continue to show utilisation. The chart and result panel distinguish timber capacity from a governing soil-response limit.

**P27-CHG-023 - Cross-section growth rings recentered**
Adjusted the section texture placement so the pith and ring centre align with the geometric centre of the pole cross-section.

**P27-CHG-024 - Probe registration under deformation**
Corrected the scene placement of Detect probes so they follow the loaded pole centreline at the selected height instead of becoming visually detached.

**P27-CHG-025 - Detect wording**
Renamed `Position the pair` to `Position the UB1000 probes` and updated dimensional/context text for the revised assemblies.

**P27-CHG-026 - Load slider wording and default**
Replaced the earlier unlock/local wording with `Lock load point slider`; the setting now defaults on.

**P27-CHG-027 - Break visual correction**
Removed the earlier displaced/broken-pole presentation and brown groundline effect. Break mode now annotates the continuously deformed pole, preserving all attached model features and allowing continued what-if analysis.

**P27-CHG-028 - Break-zone distinction**
The break marker uses the timber critical section even when soil restraint is the first overall model limit. Likely and recorded break zones are explicitly distinguished.

**P27-CHG-029 - Chipping visual correction**
Section textures and exterior geometry now omit chipped material and display the reduced outside circumference, including facets and taper.

**P27-CHG-030 - Drill visual correction**
Reversed the bore direction from upward-and-inward to the field-inspection convention of downward-and-inward.

**P27-CHG-031 - Detection-section framing**
Updated section framing and probe reach calculations for the longer, narrower UB1000 geometry so the assemblies remain visible and correctly scaled.

**P27-CHG-032 - Detect result units and qualification text**
Updated the teaching proxy and estimated pole-top capacity readouts to respect the selected units and more clearly separate known sandbox condition, structural capacity and uncalibrated ultrasonic inference.

**P27-CHG-033 - Reference attribution in the model**
Added a concise Power Line Systems source and verification disclaimer to the US class/material provenance displayed by the model.

**P27-CHG-034 - Regression coverage**
Added P27 requirement checks and expanded inherited checks for units, country independence, load offset, hidden Detect UI, below-ground probes, chipping, angled drilling, break mode, observed breaks, heart rot, shell rot and revised UB1000 dimensions.

## Additional Reference Data and Documentation

**P27-REF-001 - Goldpine class data**
Added supplied New Zealand Radiata pine Electropoles class rows covering length, load class, embedment, minimum tip diameter and minimum groundline diameter. Model butt diameter is identified as a linear-taper extrapolation.

**P27-REF-002 - ANSI O5.1 class data**
Added supplied ANSI O5.1-2022 Table 8 rows for Douglas-fir and Southern Pine classes H6, H5, H4, H3, H2, H1, 1-7, 9 and 10 over applicable 20-125 ft lengths. Published top and six-foot circumferences are converted to diameters; model groundline/butt geometry and the US embedment starting point are identified as derived values.

**P27-REF-003 - Power Line Systems cross-check**
Recorded that selected US class and material fields were cross-checked against the Power Line Systems ANSI O5.1-2017 PLS-POLE library. The source is secondary, supplied as-is and does not replace verification against applicable ANSI or RUS material.

**P27-REF-004 - Country and standards metadata**
Added NZ, AU and US standard labels, species-region mappings and embedment starting heuristics. Australia currently has no populated verified pole-class table.

**P27-REF-005 - `README.md` modified**
Updated product/version identity, startup information, UB1000 dimensions, unit corrections, load-offset behaviour, ring alignment and opt-in break summary.

**P27-REF-006 - `START-HERE.txt` created**
Added local startup, verification, branch, staging and model-scope guidance for the P27 handoff.

**P27-REF-007 - `docs/Requirements.md` created**
Mapped supplied requests REQ1-REQ13 into functional requirements FR-001-FR-013, with acceptance status, implementation decisions and non-functional requirements.

**P27-REF-008 - `docs/TODO.md` created**
Preserved the original supplied P27 requirements verbatim for traceability.

**P27-REF-009 - `docs/About this model.md` created**
Recorded P27's origin from Carl Rathbone's P26 model and the separation between baseline and development work.

**P27-REF-010 - `docs/DEPLOYMENT.md` created**
Documented the isolated Cloudflare Pages staging process and Access-policy prerequisite.

**P27-REF-011 - `docs/P19-MATERIAL-SOURCES.md` modified**
Added the PLS-POLE cross-check, field interpretation and secondary-source qualification for US reference data.

**P27-REF-012 - `docs/P27-UB1000-GEOMETRY.md` created**
Recorded the supplied UB1000 dimensions, wave-guide interface, display conventions and revised break-display behaviour.

**P27-REF-013 - `docs/considerations for impact of heart rot decay on pole strength.md` created**
Documented the geometric reason central heart rot may have a modest bending effect, the current illustrative severity laws, unmodelled mechanisms, evidence needed for calibration and a recommended bounded-results presentation.

**P27-REF-014 - `docs/P27-CHANGELOG.md` created**
Created this human-readable, reference-ID-based release record covering the complete P26-to-P27 change set.

## Further Work Todo

**P27-TODO-001 - Complete protected staging deployment**
Confirm allowed reviewer email addresses/domains, configure Cloudflare Access, deploy `pole-insights-staging`, and verify anonymous denial plus authorised OTP access. Do not alter production DNS.

**P27-TODO-002 - Calibrate decay material properties**
Replace the illustrative heart/shell stiffness and strength relationships with species-, treatment-, moisture- and decay-specific evidence. Keep stiffness and strength as separate calibrated quantities.

**P27-TODO-003 - Validate full-scale pole response**
Use full-scale bending tests with measured defect geometry to validate load-deflection response, capacity, failure mode and failure location. Retain independent holdout poles and quantify uncertainty.

**P27-TODO-004 - Define UB1000 interpretation**
Obtain an approved measurement-to-condition/property relationship and representative reports before converting simulated or measured ultrasonic output into strength, capacity, RSV or Safe-to-Climb decisions.

**P27-TODO-005 - Qualify nonlinear failure mechanics**
Develop and validate progressive damage, splitting, shear, shell instability, crushing and post-first-fibre redistribution before presenting ultimate breakage or fracture animation as a prediction.

**P27-TODO-006 - Extend local solid analysis**
Qualify local solid-FE treatment of angled drilling, chipping, shell rot and graded heart rot, including mesh convergence, free surfaces and stress concentrations.

**P27-TODO-007 - Complete regional pole-class data**
Add verified Australian class tables and any additional NZ/US species/class combinations required by users. Confirm editions, applicability, conditioning and adjustment rules before enabling presets.

**P27-TODO-008 - Validate derived pole geometry**
Review assumptions used to derive butt and groundline diameters from published stations and taper. Replace derived values with authoritative dimensions where available.

**P27-TODO-009 - Expand asymmetric decay studies**
Test eccentric and irregular heart rot, offset shell rot, transition zones, overlapping defects and multiple load directions against independent section calculations and physical evidence.

**P27-TODO-010 - Browser and device review**
Complete a formal visual/interaction pass over desktop and mobile layouts for the expanded controls, long Imperial labels, below-ground Detect interactions and break annotations.

**P27-TODO-011 - Release decision and merge process**
Review P27 on `dev`, resolve accepted discussion points, then use the GitHub diff/merge process to selectively return approved functionality to the maintained model. Preserve the P26 baseline tag/branch.

## Discussion Points

**P27-DISC-001 - Meaning of decay severity**
The current percentage is an assumed local material degradation input, not percentage pole-capacity loss, percentage missing wood or a calibrated UB1000 measurement. Decide whether the UI should instead request explicit residual stiffness and residual strength or use named evidence-backed condition classes.

**P27-DISC-002 - Heart-rot axial progression**
Source mode currently peaks at one height and tapers to zero at the entered ends, which can create a localised chart spike. Decide whether uniform condition, measured axial profiles or a different conservative envelope should be the default.

**P27-DISC-003 - Heart-rot structural mechanisms**
Simple bending theory gives central material relatively little influence because it lies near the neutral axis. Determine when weakened transition wood, shear, splitting or shell instability should govern instead of longitudinal bending.

**P27-DISC-004 - Shell-rot first-fibre limit**
Severe outer decay can govern the current first-fibre criterion even when the layer is thin. Decide whether progressive loss and stress redistribution are required for the intended capacity meaning.

**P27-DISC-005 - Meaning of the break display**
The visual currently marks an illustrative timber critical zone or a user-entered observed zone while leaving the loaded geometry intact. Confirm whether this is the desired review tool or whether a separately qualified fracture sequence is eventually required.

**P27-DISC-006 - Soil versus timber governing limits**
The first model limit can be soil response while the break marker uses timber capacity. Confirm that users understand this distinction and whether both locations should be simultaneously annotated.

**P27-DISC-007 - Status of recorded break data**
Actual break height and force currently replay an observation but do not update model parameters. Define a controlled calibration workflow before using post-mortem cases to tune material or soil properties.

**P27-DISC-008 - Applicability of pole standards**
Country and class selection provides reference geometry and material starting points, not a complete code assessment. Editions, grade, conditioning, treatment, load factors, reliability and jurisdiction-specific rules remain the assessor's responsibility.

**P27-DISC-009 - Below-ground UB1000 context**
Negative detection heights represent excavation or an unembedded pole. Confirm whether additional workflow state or warnings are needed to prevent interpretation as through-soil testing.

**P27-DISC-010 - Safe-to-Climb boundary**
The model does not issue an official Safe-to-Climb result. Confirm the evidence, policy ownership, uncertainty treatment and approval process required before any such decision is introduced.

**P27-DISC-011 - Reference-data governance**
ANSI and other standards are copyrighted and may change. Confirm who owns source verification, edition control and approval of derived tables before a production release.

**P27-DISC-012 - Capacity terminology**
Current capacity is an elastic beam/first-material-limit reference, not ultimate break load or factored design resistance. Decide whether labels should be made more explicit before external review.
