const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:55604/tests/browser.html?autorun=1");
    await page.waitForFunction(
      () => /^(PASS|FAIL)/.test(document.title),
      null,
      {
        timeout: 60000,
      },
    );
    const title = await page.title();
    console.log(title);
    console.log(await page.locator("#results").innerText());
    if (!title.startsWith("PASS") || errors.length)
      throw Error(errors.join("\n") || title);
    const base = "http://127.0.0.1:55604";
    async function fixture(name) {
      await page.goto(base + "/tests/save-fixture.html");
      await page.locator(`[data-case="${name}"]`).click();
      await page.goto(base + "/index.html?test=1");
    }
    for (const seat of [1, 2, 3]) {
      await fixture("ai" + seat);
      await page.reload();
      await page.waitForFunction(
        () =>
          document.querySelector("#phase-label").textContent === "YOUR TURN",
      );
      const turns = await page.locator("#round").innerText();
      if (!turns.includes(`${4 - seat} TURNS COMPLETED`))
        throw Error("Reload duplicated/lost AI turn at seat " + seat);
    }
    await fixture("legacy");
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector("#phase-label").textContent === "YOUR TURN",
    );
    if (
      (await page.locator(".player").count()) !== 2 ||
      !(await page
        .locator("#save-notice")
        .innerText()
        .then((x) => x.includes("2-player")))
    )
      throw Error("Legacy fresh-page resume failed");
    for (const [name, dialog] of [
      ["return", "#return-dialog"],
      ["noble", "#noble-dialog"],
    ]) {
      await fixture(name);
      await page.reload();
      if (!(await page.locator(dialog).isVisible()))
        throw Error("Pending " + name + " reload failed");
    }
    await fixture("done");
    await page.reload();
    if (
      !(await page
        .locator("#result-title")
        .innerText()
        .then((x) => x.includes("shared")))
    )
      throw Error("Shared result reload failed");
    await fixture("malformed");
    if (!(await page.locator("#welcome").isVisible()))
      throw Error("Malformed save did not recover");
    await page.locator("#start").click();
    if ((await page.locator(".player").count()) !== 4)
      throw Error("New match not four players");
    if (errors.length) throw Error(errors.join("\n"));
    console.log(
      "PASS · 8 top-level save fixtures plus real page reloads, all AI seats and legacy migration",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
