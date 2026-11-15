# Aster 3.0.3 — measured UI update and persistence improvements

## Changes
- Synchronous bursts of state-change events schedule one full UI snapshot on the next event-loop turn instead of constructing/sending one per event.
- Guest-view hiding and layout remain synchronous, so permission requests do not wait for state serialization to obscure the web page.
- Pending publications are cancelled on shutdown.
- The renderer retains unchanged tab DOM rather than replacing it during unrelated state updates. This preserves keyboard focus and avoids unnecessary icon/control reconstruction.
- Tab activation no longer writes a profile whose saved session data did not change. Navigation's committed session and visit history are saved together rather than in two consecutive writes.
- Explicit session mutation/shutdown writes remain in place.

## Evidence
Three unit tests cover event coalescing, latest-value delivery, reentrant scheduling and disposal. Real Electron measurement: 100 synchronous emit calls produced exactly one constructed/published state snapshot; 20 tab activations produced zero profile writes. Renderer preference updates arrived, unchanged tabs retained their DOM/focus, and changed page titles still updated. Real permission overlay behavior, baseline browsing/persistence, window restoration and 12-tab cleanup regressions passed.

These are measurements of redundant work under the tested conditions, **not** a claim of a measured overall CPU/RAM percentage improvement. Full-state snapshots still contain large data, and filter parsing remains synchronous; further optimization is pending.

Full unit suite: 122 passed. Measured state-publishing checks passed against source, packaged and installed executables. Packaged vertical tabs, saved zoom and lifecycle regressions passed. Installation exited0, preserved the user profile JSON hash, and the installed browser loaded Google. Evidence: tests/artifacts/installer-3.0.3-results.json and state-publishing-results.json. No OAuth, VPN, hosting or signing prerequisites are changed by this patch. Earlier release artifacts are preserved.
