# P19 material catalogue — 26 September 2026

The catalogue identifies 20 species/species groups. Eight entries have a published pole reference. The other entries accept documented user-supplied E and bending strength; no values from another species are silently applied. Existing radiata-pine cases retain their P01 teaching values.

## USA

The pole-specific reference is **ANSI O5.1-2022, Wood Poles — Specifications and Dimensions**. Values below are the published SI values in the [North American Wood Pole Council bulletin 18-D-203, August 2024, page 3](https://woodpoles.org/wp-content/uploads/TB_Pole_MOE.pdf). The bulletin explicitly describes E as mean MOE and says these values supersede older RUS stiffness values of uncertain origin.

| Pole species | Designated bending fibre strength, MPa | Mean E, GPa |
|---|---:|---:|
| Coastal Douglas fir | 55.2 | 16.40 |
| Western larch | 57.9 | 18.27 |
| Southern pine group | 55.2 | 14.68 |
| Western red cedar | 41.4 | 9.86 |
| Lodgepole pine | 45.5 | 11.44 |
| Red / Norway pine | 45.5 | 10.13 |

The separate through-bored Douglas-fir option uses 52.44 MPa, the bulletin's 5% reduction. This treatment adjustment is distinct from adding a simulated inspection bore to the defect geometry. Avoid counting the same reduction twice.

Some US class and material fields were cross-checked against the [Power Line Systems ANSI O5.1-2017 PLS-POLE component library](https://www.powline.com/files/pls_pole/ansi/ansi_O5-1.html). Its WPP rows identify class, length, top circumference, circumference 6 ft from butt and default groundline distance; its MAT rows identify MOE, fibre stress and assumed density. PLS provides these secondary files **as-is** and requires users to verify them; they do not replace the applicable ANSI O5.1 or RUS source.

The standard's conditioning, geometry, class, height and design provisions still need to be satisfied. P19 does not implement Annex A adjustments, NESC design factors, reliability checks or allowable working loads. The catalogue deliberately excludes ANSI's radiata-pine row: its stated geographic and class restrictions describe Chilean poles, not NZ radiata pine.

For static testing, use [ASTM D1036-99(2025), Standard Test Methods of Static Tests of Wood Poles](https://store.astm.org/d1036-99r25.html). Its scope includes cantilever and machine testing, treated and untreated poles, stiffness, strength, and effects of defects and treatment. P19 is not an implementation of either test procedure: its present load point is the physical tip and its fixed restraint is at groundline. A test at another point or with a different support arrangement requires the corresponding structural model.

## United Kingdom

[BS EN 14229:2010](https://knowledge.bsigroup.com/products/structural-timber-wood-poles-for-overhead-lines) is the relevant pole product standard. A species name alone is insufficient: use the applicable supplier declaration and treatment.

| Entry | E, GPa | Declared bending reference, MPa | Source and scope |
|---|---:|---:|---|
| Scots pine | 9.433 | 37.1 | [Scanpole SPAS3](https://www.scanpole.com/files/sites/3/2025/01/spas_ilseng_declaration-of-performance_2023.pdf), signed 25 November 2022: untreated Pinus sylvestris, Northern / North-Eastern Europe, Ilseng production. |
| European Douglas fir | 10.795 | 34.1 | [Scanpole SPBBH4](https://www.scanpole.com/files/sites/6/2025/01/bbhltd_declaration-of-performance_2023.pdf), signed 25 November 2022: creosote-treated German-grown coastal Douglas fir. The declaration calls this MOR a **mean**. |

These supplier-specific values are not universal UK characteristic grades. The presets preserve that distinction in their visible scope text and saved source identifiers. Original manufacturer PDFs were downloaded and the relevant tables visually checked: SPAS3 on page 3, SPBBH4 on page 2. The NAWPC table and its footnotes were also checked on page 3. Retrieval hashes are in `verification/results/p19-source-checks.json`.

## New Zealand and Australia

The naming to check is **AS 1720.1:2010** (Australia, with applicable amendments) and **NZS AS 1720.1:2022** (NZ adoption with modifications). [Standards Australia's product record](https://store.standards.org.au/product/as-1720-1-2010) and the [National Library of NZ catalogue](https://natlib.govt.nz/records/52113199) identify these editions. The applicable round-timber grading and overhead-line provisions must also be checked; a generic sawn F-grade table must not be substituted automatically for a qualified pole grade.

The licensed property tables and applicable round-pole modifications were not available for verification. **P19 does not claim to contain approved AS/NZS design presets.** Enter verified pole-grade or full-pole test values in “Known pole / test data”, with the grade, condition and source. The pending catalogue entries are usable once those values are supplied. No default stiffness or strength is fabricated for them.

[DTM Timber's power-pole supply table](https://dtmtimber.com.au/power-poles/) supports the Australian hardwood selection and these reported strength groups:

| Group | Species |
|---|---|
| S1 | Grey ironbark, grey gum |
| S2 | Spotted gum, blackbutt, tallowwood, Gympie messmate, grey box, red ironbark, narrow-leaved red ironbark |
| S3 | Forest red gum |

Jarrah is included as a regional pole species, supported by [Preschem's pole-management overview](https://preschem.com/pole-management/australian-wooden-pole-standards/). [NZ Poles](https://www.nzpoles.com/poles/utility-poles/) documents radiata-pine utility poles and proof testing. Regional grouping is a catalogue navigation aid, not a claim that every listed species is currently supplied in every NZ/Australian network.

The [Walford and Chapman 2010 radiata-pole study](https://www.auckland.ac.nz/assets/creative/about-the-faculty/school-of-architecture/docs/radiata-pole-strength-tbsgroup.pdf) illustrates why historic code tables and small-sample means cannot simply become current fleet-wide test predictions. Its shaved, steamed, wet sample and dynamic stiffness measurements have a specific scope. None of its sample values has been silently substituted into P19.

## How P19 uses the data

- Bending-reference cases check signed beam bending stress against Fb times the existing prescribed deterioration/grain factor. Fb is **not** relabelled as direct material tension or compression strength.
- Legacy teaching cases retain their separate 35 MPa tension / 25 MPa compression criterion, preserving old results and imports.
- E affects section stiffness and displacement. It is stored separately from the bending reference.
- Local solid stress components can still be inspected. With only Fb available, local solid utilisation and normal-stress failure ratios are withheld; no transverse or direct fibre strengths are invented.
- Detect's MPa placeholder uses the selected sound reference. It remains a sandbox conversion, not a measured UB1000 strength. Whole-pole timber capacity remains a separate structural result.
- Changing material invalidates analysis caches and ground-history geometry keys. Saved cases preserve the values, source and reference identifier. Edited published values must be saved as user-entered data.
- Source dates, grade, treatment, moisture, statistical basis, test arrangement and relevant modification factors must be checked before an actual engineering use. Characteristic/designated values are not average individual breaking strengths. Defect laws and transverse elastic ratios remain illustrative.
