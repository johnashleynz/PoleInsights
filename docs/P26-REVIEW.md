# P26 · Narration-driven films and inspection introductions

27 September 2026. Local review only; no deployment.

## Changes

Reworked the five existing films and added **UB1000 and the analyser** and **Introducing Safe2Climb**. The owner authorised all stages without approval gates. All seven retain en-GB-RyanNeural via edge_tts, one call per chapter, at -8% rate. Marked scripts define pauses and word-timed camera/label cues. Pauses are inserted into decoded PCM at inter-word gap midpoints; raw MP3s and both timing sets are retained. Each film is normalised once, with a continuous -62 dBFS filtered noise bed.

Camera framing now holds between short moves. Model films have 91–93% static camera time; UI films use fixed framings and cuts. Labels follow narration cues with three-second minimum windows. The 3 kN first-film case remains green/blue and the wording now matches it. “Measured taper” becomes “Entered dimensions”. The correction audit records the other wording/frame mismatches.

The pole-test walkthrough uses genuine captures of the current P25 controls with focus rings. The new introductions use the bundled P25 Samsung phone workflows. Short captured frame sequences are followed by editorial holds and paired detail/context views; these are not uninterrupted live recordings. Safe2Climb covers structured inspection, another UB1000 evidence layer, lean and manually entered movement, and issue/audit records. “Calibrated” is omitted as instructed.

## Verification

`node tools/build.mjs` passes TypeScript, the complete existing numerical/integration suite, 362 P26 narration/camera/label/source checks, and Vite production build. Previous P18 continuous-camera assertions were replaced by the new static-default contract; P19 library/timing assertions now match seven films. Engineering assertions remain in place.

All seven final MP4s decode without errors: H.264, 1280×720, 30 fps. Mixed WAVs are mono 44.1 kHz, 16-bit PCM, with no clipped samples. Duration matches the render manifest within 0.1 seconds. Two-second contact sheets and the cue audit record visual checks. Voice timings are service WordBoundary timings, not independent speech recognition. Vite reports its existing large-bundle advisory.

## Reproduction and remaining limits

`scripts/storyboard.json` is the marked source; `public/videos/manifest.json` contains timed shots, labels and captions. `tools/narrate_p26.py` uses cached raw chapter MP3s when their exact voice-input fingerprints match. `?video-studio` records chapter WebMs into `.media-p26`; `tools/encode_p26.py` creates the final exports. Python dependencies: edge_tts, numpy, imageio_ffmpeg. Node dependencies remain defined by the existing package and lockfile.

The source UI was P25. P26 changes video authoring and the library, not engineering calculations or original mockup projects. Simulated waves, fixture analyser outcomes and prototype inspection records remain distinguished from measurements. Beam first-limit estimates are not validated fracture loads; these films do not grant climbing clearance. Demo lean is an image-plane angle, and movement is manually entered. Demo audit data is local, with no live network handover. Existing P25 archives and the original video-review ZIP are preserved.

See the delivered `pipeline.md`, marked scripts, correction audit, shot/cue tables, chapter WPM, contact sheets and media-check JSON for detailed evidence.
