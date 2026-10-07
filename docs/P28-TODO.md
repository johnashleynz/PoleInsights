# P28 Production Backlog

Updated 8 October 2026. These are not delivered features.

| ID | Story / Work | Acceptance Before Completion |
|---|---|---|
| P28-TODO-001 | Select an authorised customer/account globally. | Confirm provider enumeration or per-account credentials; server-approved account choices, user-to-account permission on every request, account-scoped tokens/caches and saved provenance. Test cross-account denial; dropdown alone is not isolation. |
| P28-TODO-002 | Retrieve authoritative survey dimensions and RSM. | Resolve nested visual-survey HTTP 500; confirm length units and RSM field/formula; no AR-derived RSM guess. |
| P28-TODO-003 | Identify repeated assessment runs. | Obtain API run/session provenance and Grid Manager's summary rules; preserve samples, do not guess which ones belong to each repeat. |
| P28-TODO-004 | Review differing girths at the same height. | Approve explicit selection or another evidence-backed rule. Current first usable value policy warns; no silent averaging. |
| P28-TODO-005 | Keep modelling public with integration-only sign-in. | Add deliberate login entry and correct Access redirect/session flow. Current simplest setup protects the full app. |
| P28-TODO-006 | Audit Access and secrets. | Rotate screenshot-exposed client secret; store as Secret not Text; review company domains/exact emails, remove broad Gmail permission, check production AUD and anonymous denial. Review every app sharing a policy. |
| P28-TODO-007 | Harden histories and operations. | Bounded pagination, rate limits, token refresh/retry and account-scoped monitoring without private payloads/secrets. |
| P28-TODO-008 | Verify Axonic OS launching. | Test installed handler, matching-profile login and missing-handler behaviour on supported Windows/mobile clients. |
| P28-TODO-009 | Qualify structural assessment. | Carry forward P27 decay calibration, full-scale tests, local FE, regional table verification, uncertainty and Safe-to-Climb governance. |
| P28-TODO-010 | Review and promote P28. | Carl restores his P26 media, runs full build and reviews source assumptions. Explicit merge/promotion decision; no automatic main/DNS change. |
