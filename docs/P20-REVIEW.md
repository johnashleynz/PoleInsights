# P20 — Immediate species selection and compact properties

26 September 2026. Local review; no deployment.

## Changes

Available species presets now apply immediately when selected. Previously the dropdown changed only an unapplied draft; the displayed capacity remained that of the original material until Apply material was clicked.

Properties is a native collapsing menu, closed initially. The inline teaching-values sentence has been removed. The radiata example now exposes editable E, direct tension and compression strengths. Published bending references can be copied into editable, explicitly user-entered values. Apply material commits manual edits together after validation.

New Zealand and Australia are separate groups. NZ has radiata pine, NZ-grown Douglas fir and NZ-grown European larch (Larix decidua). Australia retains the existing pole hardwoods and adds southern plantation pines, hoop pine and maritime pine; radiata is available in both regional lists with one compatible saved identifier. US western larch (Larix occidentalis) retains its separate scoped reference.

Unpopulated species explicitly say “enter properties”. Selecting one opens the form and identifies both the requested species and the species whose results remain displayed. It does not silently relabel the old results or borrow another species' properties. Applying valid data switches the model. Cancel restores the current selection. This is a deliberate remaining data gap, not an automatic preset for every species.

## Evidence

TypeScript and the full build verification pass: 457 checks (the P19 catalogue checks now cover five additional species). Existing checks independently cover stiffness/deflection, bending strength/capacity, inspection MPa conversion, chart agreement, import validation and published-reference integrity.

Browser checks on the local development app:
- Initial Properties closed; separate regional optgroups; no inline teaching-values sentence.
- Radiata example with yielding ground, 1 kN: timber limit 8.02 kN and tip movement 147 mm.
- Selecting US western larch alone: results immediately become pending, then timber limit 18.56 kN and movement 75 mm. Headline soil-governed limit changes only from 1.62 to 1.82 kN.
- Selecting NZ European larch opens empty properties and explicitly names the still-active western-larch results; incomplete data cannot apply.
- Entering E = 11 GPa, Fb = 30 MPa and a verification-only source then applying gives timber limit 9.62 kN and movement 112 mm. These numbers are test inputs, not a larch recommendation or saved preset.
- Restored radiata and collapsed Properties after checking.

No structural solver equations or acoustic parameters changed. Species/material changes already invalidate structural workers and ground history. For an ideal sound fixed cantilever, changing E changes displacement, while changing bending strength changes capacity; force-controlled bending stress itself need not change. Ground can govern the first model limit. Acoustic behaviour remains separately illustrative, without a calibrated species-specific UB1000 relationship. Local solid and failure qualification limits remain those of P19.

## Regional sources

NZ Farm Forestry Association: [European larch](https://www.nzffa.org.nz/species-selection-tool/species/larch/european-larch/) and [Douglas fir](https://www.nzffa.org.nz/species-selection-tool/species/fir/douglas-fir/). These establish regional species identity/growing context, not pole design values.

Australian Government ABARES: [plantation growing stock, 2024](https://www.agriculture.gov.au/abares/forestsaustralia/sofr/criterion-2/indicator-2.1b) identifies radiata, southern plantation pine hybrids, hoop and maritime pine. Commercial plantation occurrence does not establish suitability or grading for utility poles.

See P19-MATERIAL-SOURCES.md for existing pole-specific references and unresolved NZ/Australian standard tables. Overseas Douglas fir, southern pine and larch references are not assigned to locally grown counterparts.
