"use strict";
document.addEventListener("click", (event) => {
  const key = event.target.dataset.case;
  if (!key) return;
  const E = window.Prism;
  let state = E.create(44);
  if (key === "legacy") {
    state = E.create(44, 1, 2);
    state.version = 1;
  }
  if (key.startsWith("ai")) state = E.create(44, Number(key.slice(2)));
  if (key === "return") {
    state.players[0].tokens = { ...E.bag(2), gold: 0 };
    for (const k of E.colors) state.bank[k] -= 2;
    state = E.apply(state, {
      type: "take",
      colors: ["pearl", "azure", "jade"],
    });
  }
  if (key === "noble") {
    state.players[0].bonuses = E.bag(4);
    state = E.apply(state, { type: "reserve", tier: 1 });
  }
  if (key === "done") {
    state.phase = "done";
    state.winners = [1, 3];
    state.players[1].score = 15;
    state.players[3].score = 15;
  }
  if (key === "malformed") state.patrons = [null];
  localStorage.setItem("prism-atelier-test-v1", JSON.stringify(state));
  document.getElementById("status").textContent = "Saved fixture: " + key;
});
