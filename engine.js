(function (root) {
  "use strict";
  const colors = ["pearl", "azure", "jade", "coral", "ink"],
    keys = [...colors, "gold"];
  const bag = (n = 0) => Object.fromEntries(keys.map((k) => [k, n]));
  const total = (b) => keys.reduce((s, k) => s + b[k], 0);
  const profiles = [
    [
      [0, 1, 1, 1, 1, 0],
      [0, 0, 2, 1, 1, 0],
      [0, 0, 0, 2, 1, 0],
      [0, 2, 0, 0, 2, 0],
      [0, 0, 0, 0, 3, 0],
      [0, 2, 2, 0, 1, 0],
      [0, 0, 1, 3, 1, 0],
      [0, 0, 0, 4, 0, 1],
    ],
    [
      [0, 2, 2, 3, 0, 1],
      [0, 0, 3, 2, 2, 1],
      [0, 0, 0, 5, 0, 2],
      [0, 0, 4, 2, 1, 2],
      [0, 0, 0, 0, 6, 3],
      [3, 0, 0, 3, 2, 2],
    ],
    [
      [0, 3, 3, 5, 3, 3],
      [0, 0, 0, 7, 0, 4],
      [0, 0, 3, 6, 3, 4],
      [3, 0, 0, 7, 0, 5],
    ],
  ];
  const places = [
    "Dewglass",
    "Tidewheel",
    "Mosslight",
    "Sunthread",
    "Nightbloom",
  ];
  const forms = [
    [
      "Lens",
      "Kiln",
      "Garden",
      "Spindle",
      "Well",
      "Gallery",
      "Studio",
      "Archive",
    ],
    [
      "Pavilion",
      "Conservatory",
      "Observatory",
      "Foundry",
      "Sanctum",
      "Library",
    ],
    ["Palace", "Orrery", "Cathedral", "Crown"],
  ];
  const cards = profiles.flatMap((rows, t) =>
    colors.flatMap((color, c) =>
      rows.map((row, i) => {
        const cost = bag();
        colors.forEach((_, j) => (cost[colors[(j + c) % 5]] = row[j]));
        return {
          id: `${t + 1}-${c}-${i}`,
          tier: t + 1,
          color,
          cost,
          points: row[5],
          name: `${places[c]} ${forms[t][i]}`,
          art: i,
        };
      }),
    ),
  );
  const patrons = colors.flatMap((_, i) => [
    {
      id: `p${i}`,
      name: [
        "The Cartographer",
        "The Stargazer",
        "The Botanist",
        "The Weaver",
        "The Nightkeeper",
      ][i],
      cost: Object.fromEntries(
        colors.map((c, j) => [c, j === i || j === (i + 1) % 5 ? 4 : 0]),
      ),
      points: 3,
    },
    {
      id: `q${i}`,
      name: [
        "Dawn Council",
        "Tidal Assembly",
        "Verdant Circle",
        "Ember Society",
        "Twilight Court",
      ][i],
      cost: Object.fromEntries(
        colors.map((c, j) => [
          c,
          [i, (i + 1) % 5, (i + 2) % 5].includes(j) ? 3 : 0,
        ]),
      ),
      points: 3,
    },
  ]);
  function rng(seed) {
    let x = seed >>> 0;
    return () => {
      x += 0x6d2b79f5;
      let t = Math.imul(x ^ (x >>> 15), x | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, r) {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const playerName = (seat) => ["You", "Aster", "Lumen", "Vesper"][seat];
  const supplyFor = (count) => ({ 2: 4, 3: 5, 4: 7 })[count];
  function create(seed = Date.now(), first = 0, count = 4) {
    if (
      ![2, 3, 4].includes(count) ||
      !Number.isInteger(first) ||
      first < 0 ||
      first >= count
    )
      throw Error("Invalid table size or first seat.");
    const r = rng(seed),
      decks = [1, 2, 3].map((t) =>
        shuffle(
          cards.filter((c) => c.tier === t),
          r,
        ),
      );
    return {
      version: 2,
      seed,
      first,
      current: first,
      turn: 0,
      phase: "action",
      final: false,
      players: Array.from({ length: count }, () => ({
        tokens: bag(),
        bonuses: bag(),
        owned: [],
        reserved: [],
        patrons: [],
        score: 0,
      })),
      bank: { ...bag(supplyFor(count)), gold: 5 },
      market: decks.map((d) => d.splice(0, 4)),
      decks,
      patrons: shuffle(patrons, r).slice(0, count + 1),
      log: ["The atelier opens. First to 15 prestige starts the final round."],
      winners: [],
    };
  }
  // Old matches keep their original seat count and economy. Never insert players mid-match.
  function restore(saved) {
    try {
      if (
        !saved ||
        ![1, 2].includes(saved.version) ||
        !Array.isArray(saved.players)
      )
        return null;
      const count = saved.players.length;
      if (![2, 3, 4].includes(count) || (saved.version === 1 && count !== 2))
        return null;
      if (
        ![saved.first, saved.current].every(
          (i) => Number.isInteger(i) && i >= 0 && i < count,
        )
      )
        return null;
      if (
        !Number.isInteger(saved.turn) ||
        saved.turn < 0 ||
        typeof saved.final !== "boolean" ||
        !["action", "return", "noble", "done"].includes(saved.phase)
      )
        return null;
      const validBag = (b) =>
        b && keys.every((k) => Number.isInteger(b[k]) && b[k] >= 0);
      const validCard = (c) =>
        c &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        colors.includes(c.color) &&
        [1, 2, 3].includes(c.tier) &&
        Number.isInteger(c.points) &&
        c.points >= 0 &&
        validBag(c.cost);
      const validPatron = (patron) =>
        patron &&
        typeof patron.id === "string" &&
        typeof patron.name === "string" &&
        patron.points === 3 &&
        patron.cost &&
        colors.every(
          (color) =>
            Number.isInteger(patron.cost[color]) && patron.cost[color] >= 0,
        );
      if (
        !validBag(saved.bank) ||
        !Array.isArray(saved.decks) ||
        saved.decks.length !== 3 ||
        !Array.isArray(saved.market) ||
        saved.market.length !== 3
      )
        return null;
      if (
        ![...saved.decks, ...saved.market].every(
          (row) => Array.isArray(row) && row.every(validCard),
        )
      )
        return null;
      if (
        !saved.players.every(
          (p) =>
            validBag(p.tokens) &&
            validBag(p.bonuses) &&
            Number.isInteger(p.score) &&
            p.score >= 0 &&
            Array.isArray(p.owned) &&
            p.owned.every(validCard) &&
            Array.isArray(p.reserved) &&
            p.reserved.length <= 3 &&
            p.reserved.every(validCard) &&
            Array.isArray(p.patrons) &&
            p.patrons.every(validPatron),
        )
      )
        return null;
      if (
        !Array.isArray(saved.patrons) ||
        !saved.patrons.every(validPatron) ||
        !Array.isArray(saved.log) ||
        !saved.log.every((x) => typeof x === "string") ||
        !Array.isArray(saved.winners) ||
        !saved.winners.every((i) => Number.isInteger(i) && i >= 0 && i < count)
      )
        return null;
      return { ...structuredClone(saved), version: 2 };
    } catch {
      return null;
    }
  }
  function view(s, p = s.current) {
    return {
      current: s.current,
      first: s.first,
      turn: s.turn,
      phase: s.phase,
      final: s.final,
      bank: { ...s.bank },
      market: structuredClone(s.market),
      deckCounts: s.decks.map((d) => d.length),
      patrons: structuredClone(s.patrons),
      players: s.players.map((x, i) => ({
        ...structuredClone(x),
        reserved: x.reserved.map((c) =>
          i === p || c.public
            ? structuredClone(c)
            : { hidden: true, tier: c.tier },
        ),
      })),
    };
  }
  function due(p, c) {
    return Object.fromEntries(
      colors.map((k) => [k, Math.max(0, c.cost[k] - p.bonuses[k])]),
    );
  }
  function payment(p, c) {
    const d = due(p, c),
      pay = bag();
    for (const k of colors) {
      pay[k] = Math.min(d[k], p.tokens[k]);
      pay.gold += d[k] - pay[k];
    }
    return pay.gold <= p.tokens.gold ? pay : null;
  }
  function eligible(s) {
    const p = s.players[s.current];
    return s.patrons.filter((n) =>
      colors.every((k) => p.bonuses[k] >= n.cost[k]),
    );
  }
  function combinations(a, n) {
    if (!n) return [[]];
    return a.flatMap((v, i) =>
      combinations(a.slice(i + 1), n - 1).map((xs) => [v, ...xs]),
    );
  }
  function actions(v) {
    if (v.phase !== "action") return [];
    const p = v.players[v.current],
      out = [];
    const available = colors.filter((k) => v.bank[k] > 0);
    for (const cs of combinations(available, Math.min(3, available.length)))
      if (cs.length) out.push({ type: "take", colors: cs });
    for (const c of colors)
      if (v.bank[c] >= 4) out.push({ type: "take", colors: [c, c] });
    v.market.flat().forEach((c) => {
      if (payment(p, c)) out.push({ type: "buy", id: c.id });
      if (p.reserved.length < 3) out.push({ type: "reserve", id: c.id });
    });
    p.reserved.forEach((c) => {
      if (payment(p, c)) out.push({ type: "buy", id: c.id });
    });
    if (p.reserved.length < 3)
      (v.deckCounts || v.decks.map((d) => d.length)).forEach((n, t) => {
        if (n) out.push({ type: "reserve", tier: t + 1 });
      });
    if (!out.length) out.push({ type: "pass" });
    return out;
  }
  function finish(s) {
    const p = s.players[s.current];
    if (p.score >= 15) s.final = true;
    s.turn++;
    const next = (s.current + 1) % s.players.length;
    if (s.final && next === s.first) {
      s.phase = "done";
      const high = Math.max(...s.players.map((p) => p.score));
      const tied = s.players
        .map((p, i) => ({ p, i }))
        .filter((x) => x.p.score === high);
      const fewest = Math.min(...tied.map((x) => x.p.owned.length));
      s.winners = tied
        .filter((x) => x.p.owned.length === fewest)
        .map((x) => x.i);
      s.log.unshift("The final round is complete.");
      return;
    }
    s.current = next;
    s.phase = "action";
  }
  function settle(s) {
    if (total(s.players[s.current].tokens) > 10) {
      s.phase = "return";
      return;
    }
    if (eligible(s).length) {
      s.phase = "noble";
      return;
    }
    finish(s);
  }
  function apply(state, a) {
    const s = structuredClone(state),
      p = s.players[s.current];
    const fail = () => {
      throw Error("That action is not legal now.");
    };
    if (s.phase === "done") fail();
    if (s.phase === "return") {
      if (
        a.type !== "return" ||
        !a.tokens ||
        keys.some(
          (k) =>
            !Number.isInteger(a.tokens[k]) ||
            a.tokens[k] < 0 ||
            a.tokens[k] > p.tokens[k],
        ) ||
        total(a.tokens) !== total(p.tokens) - 10
      )
        fail();
      for (const k of keys) {
        p.tokens[k] -= a.tokens[k];
        s.bank[k] += a.tokens[k];
      }
      settle(s);
      return s;
    }
    if (s.phase === "noble") {
      const n = eligible(s).find((n) => n.id === a.id);
      if (a.type !== "noble" || !n) fail();
      s.patrons = s.patrons.filter((x) => x.id !== n.id);
      p.patrons.push(n);
      p.score += 3;
      s.log.unshift(`${playerName(s.current)} welcomed ${n.name} (+3).`);
      finish(s);
      return s;
    }
    if (
      !actions(view(s)).some(
        (x) =>
          x.type === a.type &&
          x.id === a.id &&
          x.tier === a.tier &&
          JSON.stringify(x.colors) === JSON.stringify(a.colors),
      )
    )
      fail();
    const who = playerName(s.current);
    if (a.type === "take") {
      a.colors.forEach((k) => {
        s.bank[k]--;
        p.tokens[k]++;
      });
      s.log.unshift(`${who} collected ${a.colors.join(", ")}.`);
    }
    if (a.type === "buy" || a.type === "reserve") {
      let card,
        row,
        index,
        reserved = false;
      if (a.id) {
        for (const r of s.market) {
          const i = r.findIndex((c) => c.id === a.id);
          if (i >= 0) {
            row = r;
            index = i;
            card = r[i];
            break;
          }
        }
        if (!card) {
          row = p.reserved;
          index = row.findIndex((c) => c.id === a.id);
          card = row[index];
          reserved = true;
        }
      } else {
        card = s.decks[a.tier - 1].shift();
      }
      if (a.type === "buy") {
        const pay = a.payment || payment(p, card),
          d = due(p, card);
        if (
          !pay ||
          keys.some(
            (k) =>
              !Number.isInteger(pay[k]) || pay[k] < 0 || pay[k] > p.tokens[k],
          ) ||
          colors.some((k) => pay[k] > d[k]) ||
          total(pay) !== Object.values(d).reduce((x, y) => x + y, 0)
        )
          fail();
        for (const k of keys) {
          p.tokens[k] -= pay[k];
          s.bank[k] += pay[k];
        }
        p.owned.push(card);
        p.bonuses[card.color]++;
        p.score += card.points;
        s.log.unshift(`${who} built ${card.name} (+${card.points}).`);
      } else {
        card = { ...card, public: !!a.id };
        p.reserved.push(card);
        if (s.bank.gold) {
          s.bank.gold--;
          p.tokens.gold++;
        }
        s.log.unshift(
          `${who} reserved ${a.id ? card.name : `a hidden tier ${a.tier} plan`}.`,
        );
      }
      if (row) {
        row.splice(index, 1);
        if (!reserved && s.decks[card.tier - 1].length)
          row.splice(index, 0, s.decks[card.tier - 1].shift());
      }
    }
    if (a.type === "pass") s.log.unshift(`${who} passed: no legal action.`);
    settle(s);
    s.log = s.log.slice(0, 80);
    return s;
  }
  function choose(v) {
    const p = v.players[v.current];
    if (v.phase === "return") {
      const tokens = bag(),
        copy = { ...p.tokens };
      for (let n = total(copy) - 10; n > 0; n--) {
        const k =
          colors
            .filter((k) => copy[k] > 0)
            .sort((a, b) => copy[b] - copy[a])[0] || "gold";
        tokens[k]++;
        copy[k]--;
      }
      return { type: "return", tokens };
    }
    if (v.phase === "noble") {
      const n = v.patrons
        .filter((n) => colors.every((k) => p.bonuses[k] >= n.cost[k]))
        .sort((a, b) => a.id.localeCompare(b.id))[0];
      return { type: "noble", id: n.id };
    }
    const legal = actions(v);
    const targets = [...v.market.flat(), ...p.reserved];
    const distance = (c, t = p.tokens) =>
      colors.reduce(
        (n, k) => n + Math.max(0, c.cost[k] - p.bonuses[k] - t[k]),
        0,
      ) - t.gold;
    const value = (c) => {
      const need = colors.reduce(
        (n, k) => n + Math.max(0, c.cost[k] - p.bonuses[k]),
        0,
      );
      const patron = v.patrons.reduce(
        (n, x) => n + (p.bonuses[c.color] < x.cost[c.color] ? 0.4 : 0),
        0,
      );
      return 2 + c.points * 2.8 + patron - need * 0.13;
    };
    let best = legal[0],
      score = -Infinity;
    for (const a of legal) {
      let n = -100;
      if (a.type === "buy") {
        const c = targets.find((c) => c.id === a.id);
        n = 10 + value(c) + (p.score + c.points >= 15 ? 100 : 0);
      }
      if (a.type === "take") {
        const t = { ...p.tokens };
        a.colors.forEach((k) => t[k]++);
        const ranked = targets
          .map((c) => ({ c, n: value(c) / (Math.max(0, distance(c)) + 1) }))
          .sort((a, b) => b.n - a.n)
          .slice(0, 4);
        n =
          ranked.reduce(
            (n, { c }) =>
              n +
              ((distance(c) - distance(c, t)) * value(c)) /
                (Math.max(0, distance(c)) + 1),
            0,
          ) +
          a.colors.length * 0.14 -
          Math.max(0, total(t) - 10) * 2;
      }
      if (
        a.type === "reserve" &&
        a.id &&
        v.bank.gold &&
        p.reserved.length < 2
      ) {
        const c = targets.find((c) => c.id === a.id);
        n = distance(c) <= 2 ? value(c) * 0.35 : -5;
      }
      if (n > score) {
        score = n;
        best = a;
      }
    }
    return best;
  }
  const api = {
    colors,
    keys,
    bag,
    total,
    cards,
    patrons,
    create,
    restore,
    playerName,
    supplyFor,
    view,
    due,
    payment,
    eligible,
    actions,
    apply,
    choose,
    rng,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.Prism = api;
})(typeof window !== "undefined" ? window : globalThis);
