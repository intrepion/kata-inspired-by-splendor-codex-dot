# Primary rule evidence

Verified 2026-10-22 from the publisher Space Cowboys page https://www.spacecowboys-games.com/fr/game/splendor/ linking to https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2025/12/FR_SPLENDOR_Rules.pdf (2024 base-game refresh, two-page PDF). Rules are paraphrased here, not reproduced art or text.

- PDF page 2, Actions: take three different non-gold colors, fewer only if fewer colors available; two of a color requires four in supply before the action.
- Actions: reserve any visible card or a blind top card of any tier; take one gold if available, reserve allowed without gold; maximum three, no discard.
- Buying and Bonus: purchase a market or own reserved plan; permanent discounts reduce each color, gold substitutes one-for-one even if the color is held; spent tokens return to supply, free purchases possible.
- Replacement: refill visible plans immediately, until that tier deck runs out.
- Token limit: at end of turn return chosen tokens to ten, gold included.
- Nobles: qualify using purchased-card bonuses, one per turn, mandatory choice if several qualify; no extra action or payment.
- End: reaching fifteen at turn end triggers completion of the round. Highest score, then fewest purchased development cards, then shared victory.
- Two-player setup: four tokens per color, five gold, three nobles; four face-up plans each tier, 40/30/20 decks.

Coverage: tests/engine.test.cjs exercises these seams plus 100 complete matches and information-boundary invariance. tests/browser.html exercises actual game controls and full matches. The original plan-cost profiles and patron mix are intentionally a new design; evidence supports core-rule correspondence, not full content or balance equivalence.

## Four-player revision

Rechecked the same primary publisher PDF on 2026-10-22: page 1 supplies seven tokens per color and five gold; page 2 four-player setup reveals five nobles. Turns proceed clockwise. The final-round section requires equal turns, ending with the last seat before the first-player marker. Compare all players by prestige, then fewest purchased developments, then share any remaining tie. Three-player tables use five colored tokens and four nobles, two-player tables use four colored tokens and three nobles; gold stays five.

Tests now cover all four starting seats crossed with every possible triggering position, shared/unique winners across all four seats, 100 complete four-player matches, 50 three-player matches and 100 legacy two-player matches. AI observations mask all other players' blind reserves independently.
