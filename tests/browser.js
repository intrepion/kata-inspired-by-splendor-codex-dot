"use strict";
let frame = document.getElementById("game");
const results = document.getElementById("results"),
  wait = (ms) => new Promise((r) => setTimeout(r, ms));
let count = 0,
  groups = 0;
function check(ok, msg) {
  count++;
  if (!ok) throw Error(msg);
}
document.getElementById("run").onclick = async () => {
  results.replaceChildren();
  count = 0;
  groups = 0;
  let w = frame.contentWindow,
    d = w.document,
    E = w.Prism,
    T = w.PrismTest,
    $ = (id) => d.getElementById(id),
    click = (id) => $(id).click();
  const until = async (fn, message) => {
    const end = Date.now() + 8000;
    while (Date.now() < end) {
      try {
        if (fn()) return;
      } catch {}
      await wait(25);
    }
    throw Error(message);
  };
  async function reload() {
    const query = "resume=" + Date.now();
    const fresh = document.createElement("iframe");
    fresh.id = "game";
    fresh.title = "Game under test";
    fresh.src = "../index.html?test=1&" + query;
    frame.replaceWith(fresh);
    frame = fresh;
    await until(
      () =>
        frame.contentWindow.location.search.includes(query) &&
        frame.contentWindow.PrismTest,
      "Reload ready",
    );
    w = frame.contentWindow;
    d = w.document;
    E = w.Prism;
    T = w.PrismTest;
  }

  const test = async (name, fn) => {
    await fn();
    groups++;
    const li = document.createElement("li");
    li.textContent = "PASS · " + name;
    results.append(li);
  };
  function stop() {
    T.stop();
  }
  function start(seed = 1, first = 0, count = 4) {
    T.start(seed, first, count);
    stop();
  }
  function card(id) {
    return d.querySelector(`[data-card="${id}"]`);
  }
  function play(a) {
    stop();
    const s = T.getState();
    if (a.type === "take") {
      a.colors.forEach((k) => click("gem-" + k));
      check(!$("take").disabled, "Legal collect enabled");
      click("take");
    } else if (a.type === "buy" || (a.type === "reserve" && a.id)) {
      card(a.id).click();
      check($("card-dialog").open, "Plan inspected");
      click(a.type === "buy" ? "buy" : "reserve");
    } else if (a.type === "reserve") {
      d.querySelector(`[data-deck="${a.tier}"]`).click();
    } else if (a.type === "return") {
      for (const k of E.keys)
        for (let i = 0; i < a.tokens[k]; i++)
          d.querySelector(`[data-return="${k}"][data-delta="1"]`).click();
      click("confirm-return");
    } else if (a.type === "noble")
      d.querySelector(`[data-noble="${a.id}"]`).click();
    else T.advance(a);
    stop();
    check(
      T.getState().turn > s.turn || T.getState().phase !== s.phase,
      "Action progresses turn or resolution",
    );
  }
  try {
    await test("Handbook, original artwork, legal guidance and cancel without spending turn", async () => {
      start();
      check(T.getState().players.length === 4, "Four players default");
      check(
        d.querySelectorAll(".player").length === 4,
        "Four visible standings",
      );
      check($("turn-order").children.length === 4, "Four-seat turn order");
      check(T.getState().patrons.length === 5, "Five patrons");
      check(T.getState().bank.pearl === 7, "Seven tokens per color");
      check(d.querySelectorAll("#market .plan").length === 12, "12 plans");
      check(
        new Set([...d.querySelectorAll("#market svg")].map((x) => x.outerHTML))
          .size === 12,
        "Distinct art",
      );
      click("help");
      check($("help-dialog").open, "Rules open");
      $("help-dialog").querySelector("[data-close]").click();
      click("gem-pearl");
      check($("take").disabled, "One gem illegal with three colors stocked");
      click("gem-pearl");
      check(!$("take").disabled, "Double legal at four");
      click("clear");
      card(T.getState().market[0][0].id).click();
      $("card-dialog").querySelector("[data-close]").click();
      check(T.getState().turn === 0, "Inspect cancel costs no turn");
    });
    await test("Repeated clicks spend one turn; restart cancellation and interrupted AI", async () => {
      start();
      click("gem-pearl");
      click("gem-azure");
      click("gem-jade");
      click("take");
      click("take");
      check(T.getState().turn === 1, "Repeated collection locked");
      click("restart");
      $("restart-dialog").querySelector("[data-close]").click();
      check(T.getState().turn === 1, "Restart cancel keeps state");
      click("restart");
      click("confirm-restart");
      await wait(800);
      check(T.getState() === null, "Old AI timer cannot change abandoned game");
      check(!$("welcome").hidden, "Onboarding restored");
      click("start");
      stop();
      check(T.getState().turn === 0, "Starts clean");
    });
    await test("Complete human-facing games use market, gems, payment, returns and patron controls", async () => {
      for (const seed of [3, 8, 17]) {
        start(seed, seed % 4);
        for (let n = 0; n < 600 && T.getState().phase !== "done"; n++) {
          const s = T.getState(),
            a = E.choose(E.view(s, s.current));
          if (s.current === 0) play(a);
          else {
            T.advance(a);
            stop();
          }
        }
        check(T.getState().phase === "done", "Complete UI game " + seed);
        check(!$("outcome").hidden, "Results visible");
        check(T.getState().turn % 4 === 0, "Equal turns at game end");
        for (const name of ["You", "Aster", "Lumen", "Vesper"])
          check(
            $("result-detail").textContent.includes(name),
            "Result lists " + name,
          );
        const final = T.getState().turn;
        click("take");
        check(T.getState().turn === final, "Terminal input locked");
        click("replay");
        click("confirm-restart");
        check(T.getState() === null, "Replay clean");
      }
    });
    await test("Required return, gold choice, patron choice and no escaping resolution", async () => {
      let s = E.create(2);
      s.players[0].tokens = { ...E.bag(2), gold: 0 };
      s = E.apply(s, { type: "take", colors: ["pearl", "azure", "jade"] });
      T.load(s);
      check($("return-dialog").open, "Return modal");
      $("return-dialog").dispatchEvent(
        new w.Event("cancel", { cancelable: true }),
      );
      check($("return-dialog").open, "Cannot bypass return");
      play(E.choose(E.view(T.getState())));
      s = E.create(1);
      s.players[0].bonuses = E.bag(4);
      s = E.apply(s, { type: "reserve", tier: 1 });
      T.load(s);
      check(
        $("noble-dialog").open &&
          d.querySelectorAll("[data-noble]").length === 5,
        "Choose among eligible patrons",
      );
      play({ type: "noble", id: E.eligible(T.getState())[2].id });
      check(T.getState().players[0].patrons.length === 1, "One chosen patron");
      s = E.create(4);
      const c = s.market[0][0];
      c.cost = E.bag();
      c.cost.azure = 1;
      s.players[0].tokens.azure = 1;
      s.players[0].tokens.gold = 1;
      T.load(s);
      card(c.id).click();
      const select = d.querySelector('[data-pay="azure"]');
      select.value = "1";
      select.dispatchEvent(new w.Event("change", { bubbles: true }));
      click("buy");
      stop();
      check(
        T.getState().players[0].tokens.azure === 1 &&
          T.getState().players[0].tokens.gold === 0,
        "Elective gold preserves color",
      );
    });
    await test("Blind opponent reserves and exhausted-action recovery", async () => {
      let s = E.create(12);
      s = E.apply(s, { type: "reserve", tier: 1 });
      s = E.apply(s, { type: "reserve", tier: 2 });
      s = E.apply(s, { type: "reserve", tier: 1 });
      s = E.apply(s, { type: "reserve", tier: 1 });
      T.load(s);
      stop();
      click("gem-pearl");
      click("gem-azure");
      click("gem-jade");
      click("take");
      stop();
      check(
        T.getState().turn === 5,
        "Human action renders while AI holds hidden reserve",
      );
      check(
        $("players").textContent.includes("Hidden tier 2"),
        "Blind reserve stays hidden in UI",
      );
      s = E.create(4);
      s.bank = E.bag();
      s.players[0].reserved = s.decks[2].splice(0, 3);
      T.load(s);
      stop();
      check(!$("pass").hidden, "No-action pass is offered");
      click("pass");
      stop();
      check(
        T.getState().turn === 1,
        "Pass advances only exhausted-action turn",
      );
    });
    await test("Three scheduled AIs, modal pause and interrupted/repeated inputs across all seats", async () => {
      T.start(22, 1);
      click("help");
      await wait(750);
      check(T.getState().turn === 0, "Handbook pauses AI");
      $("help-dialog").querySelector("[data-close]").click();
      await until(
        () => T.getState().current === 0,
        "Three opponents return turn to human",
      );
      check(T.getState().turn === 3, "Exactly three AI turns");
      for (const name of ["Aster", "Lumen", "Vesper"])
        check(
          $("journal").textContent.includes(name),
          name + " has own journal entry",
        );
      for (const seat of [1, 2, 3]) {
        T.start(27, seat);
        click("restart");
        click("confirm-restart");
        click("confirm-restart");
        await wait(750);
        check(
          T.getState() === null,
          "Interrupted seat " + seat + " cannot mutate new setup",
        );
      }
    });
    await test("Four-player save/resume at each AI seat and pending human resolutions", async () => {
      for (const seat of [1, 2, 3]) {
        const s = E.create(38, seat);
        T.load(s);
        stop();
        await reload();
        stop();
        check(
          T.getState().current === seat && T.getState().players.length === 4,
          "Restored AI seat " + seat,
        );
        check(d.querySelectorAll(".player").length === 4, "Standings restored");
      }
      let s = E.create(4);
      s.players[0].tokens = { ...E.bag(2), gold: 0 };
      s = E.apply(s, { type: "take", colors: ["pearl", "azure", "jade"] });
      T.load(s);
      stop();
      await reload();
      stop();
      check($("return-dialog").open, "Required returns restored");
      play(E.choose(E.view(T.getState())));
      s = E.create(4);
      s.players[0].bonuses = E.bag(4);
      s = E.apply(s, { type: "reserve", tier: 1 });
      T.load(s);
      stop();
      await reload();
      stop();
      check($("noble-dialog").open, "Patron choice restored");
      play(E.choose(E.view(T.getState())));
      s = E.create(5);
      s.phase = "done";
      s.winners = [1, 3];
      T.load(s);
      stop();
      await reload();
      stop();
      check(
        !$("outcome").hidden &&
          $("result-title").textContent.includes("shared"),
        "Shared result resumes",
      );
    });
    await test("Older two-player saves resume safely and new games still default to four", async () => {
      let s = E.create(6, 1, 2);
      s.version = 1;
      T.load(s);
      stop();
      await reload();
      check(
        T.getState().version === 2 && T.getState().players.length === 2,
        "Legacy save migrated without inserting seats",
      );
      check(
        $("save-notice").textContent.includes("2-player"),
        "Legacy match explained",
      );
      await until(() => T.getState().current === 0, "Legacy AI resumes");
      check(T.getState().turn === 1, "Legacy turn order preserved");
      click("restart");
      click("confirm-restart");
      click("start");
      stop();
      check(T.getState().players.length === 4, "Next match defaults to four");
      click("restart");
      click("confirm-restart");
      $("player-count").value = "3";
      $("player-count").dispatchEvent(new w.Event("change"));
      $("starter").value = "2";
      click("start");
      stop();
      check(
        T.getState().players.length === 3 && T.getState().current === 2,
        "Optional three-player table and starter",
      );
      click("restart");
      click("confirm-restart");
      $("player-count").value = "4";
      $("player-count").dispatchEvent(new w.Event("change"));
      click("start");
      stop();
    });
    // Rebind after reload: earlier closures intentionally refer to the previous document.
    const nw = frame.contentWindow,
      nd = nw.document;
    await test("Responsive 360px/768px layout and touch activation", async () => {
      nw.PrismTest.start(9);
      nw.PrismTest.stop();
      for (const width of [360, 768]) {
        frame.style.width = width + "px";
        await wait(80);
        check(nd.documentElement.scrollWidth <= width, "No overflow " + width);
        const button = nd.getElementById("gem-pearl"),
          r = button.getBoundingClientRect();
        check(r.width >= 44 && r.height >= 44, "Touch target " + width);
      }
      const b = nd.getElementById("gem-pearl");
      b.dispatchEvent(
        new nw.PointerEvent("pointerdown", {
          pointerType: "touch",
          bubbles: true,
        }),
      );
      b.dispatchEvent(
        new nw.PointerEvent("pointerup", {
          pointerType: "touch",
          bubbles: true,
        }),
      );
      b.click();
      check(
        nd.getElementById("gem-pearl").getAttribute("aria-pressed") === "true",
        "Touch-shaped activation",
      );
      frame.style.width = "1250px";
    });
    const li = document.createElement("li");
    li.textContent = `COMPLETE · ${groups} groups · ${count} assertions passed`;
    results.append(li);
    document.title = `PASS · ${groups} groups · ${count} assertions`;
    nw.PrismTest.stop();
  } catch (e) {
    const li = document.createElement("li");
    li.textContent = "FAIL · " + e.message;
    results.append(li);
    document.title = "FAIL · Prism browser checks";
    console.error(e);
  }
};
if (new URLSearchParams(location.search).has("autorun"))
  frame.addEventListener("load", () => document.getElementById("run").click(), {
    once: true,
  });
