# NZ Owner Material Presets

V28.2, added 8 October 2026. All country groups in the master list are alphabetical by
display name. Existing IDs, standard-derived references and saved cases remain.

The following six selectable NZ entries reproduce the owner's supplied table:

| Entry | Fb (MPa) | CV (%) |
| --- | ---: | ---: |
| Pinus Radiata - High, Green unshaved | 52.00 | 23.7 |
| Pinus Radiata - Normal, Green unshaved | 38.00 | 23.7 |
| Pinus Radiata - High, Steamed shaved | 37.60 | 23.7 |
| Pinus Radiata - Normal, Steamed shaved | 27.56 | 23.7 |
| Corsican Pine | 50.00 | 25.0 |
| Hardwood - Unknown | 60.00 | 25.0 |

## Basis and Limits

- These are owner-supplied pole-breaking reference presets, not independently
  verified published species-wide or factored design strengths. Attribution:
  Carl Rathbone reference material as identified by the owner. The underlying
  test report, sample scope and whether Fb is mean/characteristic are not supplied.
- Apply the listed Fb directly to the existing bending criterion; no extra
  steaming/shaving factor or statistical reduction is inferred. The fixed
  radiata values intentionally remain separate from the existing adjustable
  NZS AS 1720.1 presets. In particular, 37.60 and 27.56 MPa are not represented
  as outputs of the app's standard-derived preparation factors.
- E was not supplied. Selecting a preset retains the current pole's stiffness
  and records that assumption in its editable source. Stiffness remains editable;
  no unverified Corsican/hardwood modulus is invented. A preset cannot supply a
  complete material without a positive existing E.
- CV is stored as a fraction in material.coefficientOfVariation, displayed as a
  percentage in Properties, and saved with JSON. It does not change capacity
  until a separate distribution/quantile/design rule is explicitly agreed.
- Unknown hardwood is a provisional owner reference, not a botanical species
  or a verified hardwood grade. Its E requires review for the actual pole.
- Generic imported Pinus radiata continues to match the original species; the
  API must not silently select a high-density/preparation variant. Explicit
  variant names can match. All four variants retain NZ Goldpine class geometry
  eligibility, without asserting the measured pole complies with that class.

## Corsican Literature Search

No definitive NZ full-pole Fb matching the requested use was established in the
sources reviewed. Use the owner's authorised 50 MPa fallback, not an attributed
literature-derived strength. Relevant primary-source context:

- [Cown, Physical Properties of Corsican Pine Grown in New Zealand, NZ Journal
  of Forestry Science 4(1), 76-93](https://www.scionresearch.com/__data/assets/pdf_file/0005/30983/NZJFS411974COWN76_93.pdf)
  studies density, resin and tracheid properties; it does not establish the
  requested pole bending reference.
- [Queensland DPI/ENA timber pole review](https://era.dpi.qld.gov.au/id/eprint/3071/2/dpiandena_timber_pole_review06-sec.pdf)
  provides general pole-property and NZ density-category context, not a
  verified Corsican pole strength applicable to this preset.

## Verification

Integration regression checks cover ordering, unique IDs, all six exact Fb/CV
values, retained E, no duplicated preparation factors, JSON round trips, invalid
CV rejection, unchanged generic species matching, NZ class geometry and linear
capacity response to the supplied Fb. No physical validation is claimed.
