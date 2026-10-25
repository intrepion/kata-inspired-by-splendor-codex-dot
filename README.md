# Prism Atelier

## Play online

[Play Prism Atelier](https://intrepion.github.io/kata-inspired-by-splendor-codex-dot/) — free, playable in your browser.

An original browser game of celestial workshops, gem collecting and quiet ambition, inspired by the core mechanics of base-game Splendor. Play against three fair Automata: Aster, Lumen and Vesper, build permanent discounts, and compete for sky patrons. Reach 15 prestige to begin the final round.

## Play locally

Run `python3 server.py`, then open http://127.0.0.1:55604/ . Override with `PORT=55605 python3 server.py` if that port is busy. The server listens only on loopback. Or open `index.html` directly in a modern browser; no build, package install or network access is required to play. Local saves are browser/origin-specific and may be unavailable for direct files or restricted storage.

Four players is the default; optionally choose a two- or three-player table. Choose who starts, then open the atelier. Tap/click plans to inspect costs and choose Build or Reserve. Click three different gem colors, or double-click a color selection to choose two (four must remain in stock before taking). Confirm with Collect. A single click followed by another click on the same gem is sufficient; no timed double-click is needed. Mandatory token returns and patron choices appear automatically. How to play contains the complete rules. Tab/Enter operate controls; 1–5 select colors and H opens help when focus is outside a control. Escape cancels optional dialogs. New game asks before replacing the current match. Reload resumes saved progress, including any of the three AI turns or pending resolution steps. Older version-one two-player saves keep their original two seats and supplies, then upgrade their save format; starting a new game offers the four-player default. Invalid saves return to onboarding with an explanation.

## Rules and originality

Four players by default, 90 plans across three tiers (40/30/20), twelve face-up plans, seven tokens of each of five colors, five wild gold tokens, five patrons. Three-player tables use five tokens per color and four patrons; two-player tables use four tokens per color and three patrons. Plans supply permanent discounts and prestige. Gold is earned on reserving and can replace a color even when you own colored tokens. Reserve at most three; blind deck reserves stay private. End turns with at most ten tokens. Welcome at most one eligible patron per turn using permanent bonuses. Turns proceed clockwise through the displayed seats. Finish the round after 15 prestige so everyone has equal turns; highest prestige wins, ties favor fewer purchased plans, then share victory among all remaining tied players.

[Primary publisher rule evidence](docs/rules-evidence.md) records the official source and tested seams. Title, card names, illustrations, cost profiles and patron identities are original. This is core-rule correspondence, **not a claim of identical card distribution, balance, or complete Splendor content**. Not affiliated with its publisher or designer.

Each deterministic heuristic AI receives a sanitized observation: public holdings, market, known reserves, hidden reserve counts/tiers and its own plans. It never receives deck order, shuffle seed or hidden opponent plan identities. It is designed for approachable play, not optimal strategy. Suggestions use the same policy from the human's permitted viewpoint.

## Verification

- `npm run check`: JavaScript syntax checks.
- `npm test`: deterministic edge cases, information-boundary checks and 250 complete simulated matches across two-, three-, and four-player tables with conservation assertions.
- Open `tests/browser.html?autorun=1` on the preview: real browser controls, three complete four-player matches, repeated/interrupted actions across all AI seats, required choices, gold substitution, per-seat AI scheduling, legacy/new save restoration and narrow layouts.
- CI installs Playwright only for testing and runs `node tests/ci-browser.cjs` with a local server. This also performs genuine top-level reloads for every AI seat, older saves, required choices, finished games and malformed-save recovery, using `tests/save-fixture.html`. All test saves use a separate storage key from real matches. Runtime remains dependency-free.

Source boundaries: `engine.js` is pure rules and public-observation AI; `game.js` is rendering and interaction; `styles.css` is responsive presentation. `?test=1` enables browser acceptance hooks; normal play exposes no controller test hooks. See [specification](docs/spec.md), [glossary](CONTEXT.md), and [decision record](docs/adr/0001-local-rules-and-private-policy.md).

MIT licensed. The `.gitignore` includes the full GitHub main-branch Global/Linux.gitignore, Global/Windows.gitignore and Global/macOS.gitignore templates fetched on 2026-10-22, followed by local tooling exclusions.
