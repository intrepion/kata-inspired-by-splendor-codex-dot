const { test } = require("node:test");
const A = require("node:assert/strict");
const E = require("../engine.js");
function invariant(s) {
  for (const k of E.keys) {
    A.equal(
      s.bank[k] + s.players.reduce((n, p) => n + p.tokens[k], 0),
      k === "gold" ? 5 : 4,
    );
    A.ok(s.bank[k] >= 0);
  }
  for (const p of s.players) {
    A.equal(
      p.score,
      p.owned.reduce((n, c) => n + c.points, 0) + p.patrons.length * 3,
    );
    for (const k of E.colors)
      A.equal(p.bonuses[k], p.owned.filter((c) => c.color === k).length);
  }
  const all = [
    ...s.decks.flat(),
    ...s.market.flat(),
    ...s.players.flatMap((p) => [...p.owned, ...p.reserved]),
  ];
  A.equal(all.length, 90);
  A.equal(new Set(all.map((c) => c.id)).size, 90);
  if (s.phase === "action" || s.phase === "done")
    s.players.forEach((p) => A.ok(E.total(p.tokens) <= 10));
}
test("setup has 90 distinct original plans, 4 per tier, 3 patrons, two-player stocks", () => {
  const s = E.create(1);
  invariant(s);
  A.deepEqual(
    s.decks.map((x) => x.length),
    [36, 26, 16],
  );
  A.equal(s.patrons.length, 3);
  A.deepEqual(E.create(1), s);
});
test("three distinct; doubles require four before taking; no gold collection", () => {
  let s = E.create(1);
  s = E.apply(s, { type: "take", colors: ["pearl", "pearl"] });
  A.equal(s.bank.pearl, 2);
  A.throws(() => E.apply(s, { type: "take", colors: ["pearl", "pearl"] }));
  A.throws(() => E.apply(s, { type: "take", colors: ["gold"] }));
  A.throws(() => E.apply(s, { type: "take", colors: ["azure"] }));
  s.bank = { ...E.bag(), ink: 2, coral: 1 };
  A.ok(
    E.actions(E.view(s)).some(
      (a) => JSON.stringify(a.colors) === '["coral","ink"]',
    ),
  );
});
test("reserve gives available gold, refills, blind secrecy, limit three and no discard", () => {
  let s = E.create(2);
  const id = s.market[0][0].id;
  s = E.apply(s, { type: "reserve", id });
  A.equal(s.market[0].length, 4);
  A.equal(s.players[0].tokens.gold, 1);
  A.equal(E.view(s, 1).players[0].reserved[0].id, id);
  s = E.apply(s, { type: "reserve", tier: 3 });
  A.equal(E.view(s, 0).players[1].reserved[0].id, undefined);
  A.equal(E.view(s, 1).players[1].reserved[0].tier, 3);
  for (let i = 0; i < 4; i++) s = E.apply(s, { type: "reserve", tier: 1 });
  A.equal(s.players[0].reserved.length, 3);
  A.ok(!E.actions(E.view(s)).some((a) => a.type === "reserve"));
  A.throws(() => E.apply(s, { type: "reserve", tier: 1 }));
});
test("reserve legal when gold exhausted", () => {
  const s = E.create(1);
  s.bank.gold = 0;
  const n = E.apply(s, { type: "reserve", tier: 2 });
  A.equal(n.players[0].tokens.gold, 0);
  A.equal(n.players[0].reserved.length, 1);
});
test("payment applies permanent discounts and allows gold instead of owned colored tokens", () => {
  const s = E.create(1),
    c = s.market[0][0],
    p = s.players[0];
  p.bonuses = E.bag(8);
  p.bonuses.azure = 0;
  c.cost = E.bag();
  c.cost.azure = 2;
  p.tokens.azure = 2;
  p.tokens.gold = 2;
  const pay = E.bag();
  pay.gold = 2;
  const n = E.apply(s, { type: "buy", id: c.id, payment: pay });
  A.equal(n.players[0].tokens.azure, 2);
  A.equal(n.players[0].tokens.gold, 0);
  A.equal(n.players[0].bonuses[c.color], p.bonuses[c.color] + 1);
  A.throws(() => E.apply(s, { type: "buy", id: c.id, payment: E.bag() }));
});
test("token return is mandatory, exact, permits returning newly taken tokens or gold", () => {
  let s = E.create(1);
  s.players[0].tokens = { ...E.bag(2), gold: 0 };
  s = E.apply(s, { type: "take", colors: ["pearl", "azure", "jade"] });
  A.equal(s.phase, "return");
  A.throws(() =>
    E.apply(s, { type: "take", colors: ["ink", "coral", "jade"] }),
  );
  const tokens = E.bag();
  tokens.pearl = 3;
  s = E.apply(s, { type: "return", tokens });
  A.equal(s.current, 1);
  A.equal(E.total(s.players[0].tokens), 10);
});
test("patrons use bonuses only, mandatory choice of one, trigger final round after visit", () => {
  let s = E.create(1);
  s.players[0].bonuses = E.bag(4);
  s.players[0].score = 12;
  s = E.apply(s, { type: "reserve", tier: 1 });
  A.equal(s.phase, "noble");
  A.equal(s.final, false);
  const id = E.eligible(s)[1].id;
  s = E.apply(s, { type: "noble", id });
  A.equal(s.players[0].score, 15);
  A.equal(s.players[0].patrons.length, 1);
  A.equal(s.current, 1);
  A.equal(s.final, true);
  s = E.apply(s, { type: "reserve", tier: 1 });
  A.equal(s.phase, "done");
  A.deepEqual(s.winners, [0]);
});
test("finish round respects alternate starter; ties fewest cards then shared victory", () => {
  for (const first of [0, 1])
    for (const counts of [
      [2, 3],
      [2, 2],
    ]) {
      let s = E.create(1, first);
      s.players.forEach((p, i) => {
        p.score = 15;
        p.owned = Array(counts[i]).fill(E.cards[0]);
      });
      s = E.apply(s, { type: "reserve", tier: 1 });
      A.notEqual(s.phase, "done");
      s = E.apply(s, { type: "reserve", tier: 1 });
      A.equal(s.phase, "done");
      A.deepEqual(s.winners, counts[0] === counts[1] ? [0, 1] : [0]);
      A.throws(() => E.apply(s, { type: "reserve", tier: 1 }));
    }
});
test("AI decision invariant under hidden deck and blind opponent plan replacement", () => {
  let s = E.create(9);
  s = E.apply(s, { type: "reserve", tier: 1 });
  const a = E.choose(E.view(s));
  const t = structuredClone(s);
  t.decks.forEach((d) => d.reverse());
  t.seed = 999;
  t.players[0].reserved[0] = { ...E.cards.at(-1), public: false };
  A.deepEqual(E.choose(E.view(t)), a);
  A.equal("seed" in E.view(t), false);
  A.equal("decks" in E.view(t), false);
});
test("100 deterministic full AI matches conserve all resources and terminate legally", () => {
  let turns = 0;
  for (let seed = 1; seed <= 100; seed++) {
    let s = E.create(seed, seed % 2);
    for (let n = 0; n < 600 && s.phase !== "done"; n++) {
      s = E.apply(s, E.choose(E.view(s)));
      invariant(s);
    }
    A.equal(s.phase, "done", `seed ${seed} stalled at ${s.turn}`);
    A.ok(s.players.some((p) => p.score >= 15));
    A.equal(s.turn % 2, 0);
    turns += s.turn;
  }
  console.log("100 complete matches;", turns, "turns");
});
