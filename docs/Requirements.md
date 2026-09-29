# Pole Insights requirements

Source: `docs/TODO.md`, supplied by John Ashley on 29 September 2026. The source entries are preserved verbatim and are not edited here. The duplicate source identifier `REQ3` is mapped to `FR-003` and `FR-004`; there is no source `REQ4`.

## Functional requirements

| ID | Source | Requirement and acceptance criteria | Status | Variation / decision |
|---|---|---|---|---|
| FR-001 | REQ1 | Store an Asset ID of up to 255 characters with each case. Show it in Settings and include a filesystem-safe form in exported filenames. | Complete | Empty is allowed for existing P26 cases. |
| FR-002 | REQ2 | Provide a global Metric / Imperial control. Convert displayed and entered lengths, forces, stresses and moments while retaining SI internally. | Complete | Reference calculator conventions: ft + in, in, lbf, kpsi and lbf-ft. Decimal feet are used in editable numeric height fields; read-only formatted heights use feet + inches. |
| FR-003 | REQ3 (country) | Select NZ, AU or US configuration. Apply country defaults for units, species region, embedment heuristic and display applicable standards. | Complete | Country defaults are editable starting points, not engineering rules. AU has no supplied class table. |
| FR-004 | REQ3 (class) | Select a verified country/species pole class to populate minimum dimensions; match manually entered geometry to a verified class range. | Complete | Goldpine NZ and ANSI O5.1-2022 Table 8 reference data supplied. Derived diameters and US embedment are labelled as calculated starting points. |
| FR-005 | REQ5 | Use Pole Insights as the current product name in user-facing application surfaces and exports. | Complete | Historical P01-P26 review records and film descriptions retain their original names. Current build is labelled P27 DEV / P26 base. |
| FR-006 | REQ6 | Configure the load application offset numerically and with a deliberate drag interaction. Apply force at the corresponding height in elastic and yielding-foundation models. | Complete | The UI measures the offset downward from the pole tip; zero is the tip. SI groundline-relative height remains the compatible internal representation. |
| FR-007 | REQ7 | Provide a setting that hides Detect and all UB1000 UI references. | Complete | Existing data is retained while hidden. |
| FR-008 | REQ8 | Deploy to an isolated Cloudflare environment and protect it with Cloudflare Access email/domain policy. | Pending deployment | Access policy needs Cloudflare authentication plus confirmed allowed users/domains. No production site or DNS changes are authorised. |
| FR-009 | REQ9 | Permit Detect probe heights below groundline down to the pole butt and label the simulation context. | Complete | Negative heights represent excavation or an unembedded pole, not through-soil measurement. |
| FR-010 | REQ10 | Add chipping with height, circumferential position/arc, depth and round/faceted surface controls. Remove chipped timber from beam section integration. | Complete | Local solid-FE chipping stress concentration remains unqualified; beam section loss is assessed. |
| FR-011 | REQ11 | Store drill inclination from horizontal (0-45 degrees downward), render it, and include intersecting bore loss in section/beam calculations. | Complete | Existing level-bore integration is retained exactly; angled bores use spatial section sampling. Local solid drill preview remains limited. |
| FR-012 | REQ12 | Provide an opt-in illustrative break mode with a trigger defaulting to 200% of the timber capacity limit, and identify the critical timber section. | Complete | Break mode defaults off. The loaded pole geometry remains intact so defects and analysis overlays retain their solved positions. A static fracture seam, frozen wood fragments and likely/actual break-zone label annotate the resolved height; they are not a fracture prediction. |
| FR-013 | REQ13 | Store actual break height and force. When both exist, use them as the demonstration trigger/location and distinguish observed data from model results. | Complete | Values are user-entered observations and do not calibrate the model automatically. Partial observed values do not override the illustrative demonstration. |

## Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-001 | Preserve P26 on `main`; implement and review changes on `dev`. | Met |
| NFR-002 | Preserve SI as the calculation/storage basis and round-trip converted inputs within numerical tolerance. | Met |
| NFR-003 | Preserve qualification language: no invented standards data, UB1000 inference, Safe-to-Climb result or fracture prediction. | Met |
| NFR-004 | Validate all new persisted fields and remain compatible with P26 case files. | Met |
| NFR-005 | Add automated tests for each implemented requirement and run the full existing build suite. | Met - 18 P27 checks plus complete inherited suite and production build |
| NFR-006 | Keep staging isolated from InnerView production infrastructure and require authenticated access. | Pending deployment |

## Open deployment input

Confirm the email addresses or email domains permitted by the Cloudflare Access policy before FR-008 is deployed.

