# P11 — Result quantity, direction and utilisation colours

25 September 2026. Local review; no deployment.

## Changes

The former Analysis selector is replaced by Stress, Utilisation and Capacity (kN) buttons above the section. A separate Show results for selector chooses the specified load direction or the worst load direction. The selected section value is displayed with MPa, percent or kN. Duplicate stress/utilisation controls are removed. Saved cases retain both choices; older case files remain supported.

The utilisation palette interpolates through green at zero, blue at 40%, yellow at 60%, orange at 80%, red at 100% and dark purple at the displayed maximum above 100%. The common purple endpoint is the maximum beam height-profile utilisation across the visible cases for the selected direction basis. Where all values are below 100%, the overrun scale ends at 150%. This is a display range, not a calibrated local-solid peak. The same palette and endpoint are used by the height chart, section, pole field and legend. The filled chart continues to graduate horizontally from the zero line, not vertically by pole height.

This checkpoint also includes the preceding display follow-ups: numeric butt/tip elevations without Tip/Butt labels, a 50% larger section ring, a wider invisible leader drag target, and utilisation curves growing from right to left.

## Result meaning and direction

The height profile uses the existing two linear unit beam responses and sampled surviving material. Stress is maximum absolute longitudinal stress in MPa. Specified-direction utilisation observes the tensile/compressive strength sign. Worst-direction utilisation is the sinusoidal envelope at the sampled points, with the weaker strength sign determining the governing bearing. Worst-direction capacity is the minimum directional beam section capacity; it does not mean the previously available best-direction maximum.

Each height on a worst-direction curve can have a different governing bearing. The pole displacement and detailed field use one consistent solve at the worst beam bearing at the selected section, which is reported beside the controls. Stress can govern at a different bearing from utilisation/capacity. Changing the specified bearing or dragging the force returns the selector to specified direction. Guides temporarily use specified direction and restore the previous result choices on exit.

Capacity reports the beam section limit in the curve and readout. The pole and section colours remain utilisation under the current load, explicitly identified in the UI. Local solid FE failure capacity is not inferred from these colours. No material law, beam stiffness kernel, soil model or solid stress recovery law changes in P11. The unused best-direction angular search is skipped in the live worker; its previous verified path remains available and parity checks cover all currently selected outputs.

## Verification

The complete build passes 245 numerical/software checks, including 18 new P11 checks. These independently prescribed stress-vector checks cover signed strength selection, worst-bearing reconstruction, peak stress units, minimum directional capacity, zero-load capacity, live-path parity, fixed colour thresholds, a changing purple endpoint and continuous interpolation above 100%. Results are recorded in verification/results/p11.json. TypeScript and the production bundle pass. The existing bundle-size advisory remains.

Browser review at desktop and 390 × 844 phone sizes checked all three quantity buttons, both direction choices, unit labels, the coloured field/chart and legibility of the six palette markers. In the inspected 8 kN example at 0.30 m, worst-direction capacity was 7.97 kN and utilisation rounded to 100%; specified-direction capacity was 8.65 kN and utilisation 92%. The worst-stress value was 25.10 MPa. Returning to specified direction restored the original 359° bearing. No browser console errors were observed. A/B uses a shared palette maximum by implementation; a separate new A/B interaction study and physical touchscreen testing were not performed for P11.

These are software and numerical consistency checks, not physical validation. P09/P10 local-solid, material/soil calibration, failure and climbing-clearance limitations remain unchanged.

## Preservation

Changes remain within innerview-pole-lab. Earlier review archives and parent applications are preserved. P11 source/build archives are retained in releases. The local production preview remains on port 5191; development uses 5190.

## Follow-up — section shortcuts and capacity line

The section shortcuts now read Groundline and Critical section, with bordered, lightly filled buttons, hover/focus states and a disabled state while results are unavailable. Critical section continues to jump to the governing timber section, independently of a weaker footing limit.

Capacity plots now use a plain 3 px blue line without area shading. Stress and utilisation fills are retained. Capacity was already calculated from timber stresses rather than the combined first model limit; the solver is unchanged. Three additional regression checks reduce soil resistance strengths to 1% while retaining stiffness: the soil limit reduces by 100 times, both directional timber capacity profiles stay identical, and the timber capacity/critical height remain uncapped. Soil stiffness still legitimately affects below-ground stress distribution. Evidence: verification/results/p11-footing.json. The complete suite now contains 248 checks.

The original P11 archives remain the checkpoint before this follow-up; rebuild the working source for these changes.
