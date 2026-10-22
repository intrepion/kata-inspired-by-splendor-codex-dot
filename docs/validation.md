# Delivery validation · four-player revision

2026-10-22, on the requested Mac. This supersedes the initial two-player acceptance record.

- Primary publisher rules rechecked: four players use seven tokens per color, five gold and five patrons; turns circle through seats and final-round scoring waits for equal turns. See rules-evidence.md.
- Seventeen deterministic rule/AI test groups passed, including 250 complete matches: 100 four-player, 50 three-player and 100 legacy two-player games, totaling 19,454 completed turns. Transition invariants check resources, cards, bonuses, scores, token caps and termination. Every starter/trigger-seat combination and all-seat tie outcomes are covered.
- Native Chrome browser harness passed nine groups, 248 assertions, including three complete four-player matches through human controls, all three scheduled AI turns, repeated input, restart cancellation, interrupted callbacks at every AI seat, token returns, patron choices, elective gold, hidden reserves, serialized save restoration, older-save migration, optional three-player setup and 360/768px layout/touch-shaped input.
- Separate top-level browser fixtures test genuine full-page load/reload for all AI seats, legacy v1 two-player saves, pending returns, pending patron choices, shared results and malformed-save recovery. CI executes these using Playwright. Fixtures use isolated test storage; production matches retain the original storage key.
- Native top-level Chrome acceptance confirmed a v1 save resumes with two seats and original supplies, Lumen/Vesper each play exactly once after an interrupted reload, and a malformed patron save returns to onboarding. A new game defaults to four distinct named artisans.
- Installed Implement/Code Review workflow: independent standards/spec reviews identified malformed patron save validation. Fixed with one validator for both public and acquired patrons and negative regression cases. Both reviewers rechecked the fix and found no remaining actionable defects.
- Existing detached preview remains PID 75287 at loopback port 55604. Battleship and Guess Who checkout files, tabs and servers were not changed. Both ports 55602 and 55603 were listening before this revision.

The heuristic AI is approachable, not optimal. Card costs, patron mix and artwork remain original, with core-rule correspondence rather than identical balance. Physical touchscreen hardware is not tested. Direct-file acceptance remains unverified following the earlier browser URL-policy denial; this revision uses the verified loopback path only.
