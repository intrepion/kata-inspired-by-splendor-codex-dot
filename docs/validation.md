# Delivery validation

2026-10-22, on the requested Mac.

- Primary base-game rules verified against the linked publisher PDF; see rules-evidence.md.
- Ten deterministic rule/AI test groups passed, including 100 complete simulated matches across 5,316 completed turns. Every simulated transition checks resource/card conservation, score/bonus derivation, legal token counts and terminal state.
- Native Chrome browser harness passed seven groups and 212 assertions: three complete matches through human-facing controls, required return and patron choices, elective gold payment, repeated inputs, restart cancellation, stale AI cancellation, AI-first/modal pause, save resume, 360/768px layout and touch-shaped events.
- Native standalone play verified mouse gem collection, keyboard Enter collection of a suggested legal set, journal updates and a scheduled Automaton response. Visual inspection confirmed readable original geometric card art and market hierarchy.
- Independent code-review skill: Standards axis found no hard violations and two heuristics (duplicated payment construction and compressed readability). Payment preview/submission now share one helper; sources were formatted. Spec axis found a blind-reserve render crash and missing no-action pass control; both fixed with browser regressions. Follow-up independent spec review found no remaining actionable defects.
- The browser URL policy denied the optional direct-file native acceptance action. No alternate browser route was attempted; direct-file launch remains unverified. Loopback is the verified delivery path.
- Battleship port 55602 remained available. Guess Who port 55603 had no listener in the initial inventory and did not respond at final probes; neither checkout, server nor tab was mutated.

The AI is heuristic, not an optimal solver. Plan costs and patron mix are original; these tests establish core-rule correspondence, not identical original-game content or balance. Synthesized pointer events supplement native desktop interaction; no physical touchscreen hardware test is claimed.
