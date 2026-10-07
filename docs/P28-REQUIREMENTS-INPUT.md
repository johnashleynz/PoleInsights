# P28 Requirements Input

Recorded 8 October 2026 from the owner's integration spike and follow-up requests.
This supplements the original P27 source, preserved verbatim in `TODO.md`.

1. Persistent System preferences: Enable Detect, Enable Axonic, Enable Grid Manager.
2. Axonic profile/asset deep links, recent user-entered profiles and saved-case support.
3. Grid Manager OAuth/OData exact Asset ID search, metadata, newest/selectable SRs and UB1000 readings.
4. Immediately apply available dimensions; support both local and hosted Cloudflare use.
5. Display readings at test heights; use circumference to model sampled sections.
6. Open related Grid Manager image record by returned internal ID, not business Asset ID.
7. Units belong to individual readings; mixed units and erroneous labels exist. Preserve originals and allow correction.
8. Pole Height means AGL. RSM remains unavailable for this spike.
9. Repeated tests are valid repeatability evidence; declutter labels without deleting observations, align them to height.
10. One focused Asset ID shared across integrations; collapsible Axonic profile/link below it; relabel Grid Manager 2.0 to Grid Manager.
11. Add global customer/account selection to production TODO; current credentials access one Field team training account.
12. Identify original enhancements as P27 and integrations as P28; prepare cumulative P26 changes, as-built stories, deployment/integration notes and a full source handoff without videos/secrets.

Owner reported successful Cloudflare OTP, OAuth connection and meaningful record
retrieval. Independent user/policy audit and rotation after a dashboard screenshot
exposed the client secret remain tasks. No secret values are recorded here.
