// Campaign QA against a built preview, not a fixture:
//
//   QA_BASE_URL=http://127.0.0.1:3108 npm run qa:black-friday
//
// The header must stay on one nav row at normal sizes, and reflow cleanly when
// text is scaled to 200% without moving the page layout: the nav and action row
// wrap inside the shell, a tall header stops being sticky, and nothing is
// clipped. The open mobile menu must not trip the tall-header fallback. At the
// same setting the whole page must reflow without a horizontal scrollbar, on the
// homepage and the campaign landing page.
//
// Playwright is resolved from PLAYWRIGHT_MODULE when set (the deploy host keeps
// it outside the app's dependencies); CHROMIUM_EXECUTABLE is optional.
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"));
} catch {
  console.error("[black-friday-qa] Playwright not found. Set PLAYWRIGHT_MODULE to its entry file.");
  process.exit(2);
}

const baseUrl = (process.env.QA_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const evidenceDir = process.env.EVIDENCE_DIR || "/tmp/apfel-black-friday-qa";
await mkdir(evidenceDir, { recursive: true });

const failures = [];
let passed = 0;

function check(ok, label, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`[PASS] ${label}`);
    return;
  }
  failures.push(`${label}${detail ? ` (${detail})` : ""}`);
  console.log(`[FAIL] ${label}${detail ? ` (${detail})` : ""}`);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
  ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
});

async function open(width, lang, path = `/${lang}`, options = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, ...options });
  await context.addInitScript(() => {
    localStorage.setItem("apfel-theme", "mono");
    document.cookie = "apfel-theme=mono; path=/";
    localStorage.setItem("apfel-consent", "necessary");
    document.cookie = "apfel-consent=necessary; path=/";
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  // A fallback font has different metrics; measuring before the swap settles
  // would report a header width the visitor never sees.
  await page.evaluate(() => document.fonts.ready.then(() => true));
  // The observer that publishes the header height runs after hydration.
  await page.waitForFunction(
    () => getComputedStyle(document.documentElement).getPropertyValue("--site-header-h").trim() !== "",
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(150);
  return { context, page, errors };
}

const measure = () => {
  const header = document.querySelector("header.site-header");
  const shell = document.querySelector(".navbar-shell");
  const nav = shell.querySelector("nav");
  const actions = shell.querySelector(".ml-auto");
  const quote = actions.querySelector("button[aria-haspopup='dialog']");
  const shown = (element) => Boolean(element && element.getClientRects().length);
  return {
    headerHeight: Math.round(header.getBoundingClientRect().height),
    headerTop: Math.round(header.getBoundingClientRect().top),
    position: getComputedStyle(header).position,
    reflowed: document.documentElement.hasAttribute("data-header-reflowed"),
    headerHeightVar: getComputedStyle(document.documentElement).getPropertyValue("--site-header-h").trim(),
    shellOverflow: shell.scrollWidth - shell.clientWidth,
    nav: nav && shown(nav)
      ? { height: Math.round(nav.getBoundingClientRect().height), overflow: nav.scrollWidth - nav.clientWidth }
      : null,
    actionsHeight: Math.round(actions.getBoundingClientRect().height),
    actionsOverflow: actions.scrollWidth - actions.clientWidth,
    quoteHeight: Math.round(quote.getBoundingClientRect().height),
  };
};

/**
 * Root font-size changes re-flow the header through its 300ms transition. Sampling
 * mid-transition can catch a row before it wraps and report a clip that is gone a
 * moment later, so wait until the shell geometry stops changing and assert on the
 * settled layout - which is also how a visitor with 200% text sees it on load.
 */
async function waitForStableShell(page, timeout = 4000) {
  const snapshot = () =>
    page.evaluate(() => {
      const shell = document.querySelector(".navbar-shell");
      return `${shell.clientWidth}:${shell.scrollWidth}:${Math.round(shell.getBoundingClientRect().height)}`;
    });
  const deadline = Date.now() + timeout;
  let previous = await snapshot();
  let stable = 0;
  while (Date.now() < deadline) {
    await page.waitForTimeout(100);
    const current = await snapshot();
    stable = current === previous ? stable + 1 : 0;
    previous = current;
    if (stable >= 2) return;
  }
}

const textThresholds = { 1440: 320, 1280: 320, 1024: 240, 768: 340, 390: 300 };

async function checkNormal(width, lang) {
  const { context, page, errors } = await open(width, lang);
  await waitForStableShell(page);
  const m = await page.evaluate(measure);
  const label = `${width} ${lang} normal`;
  check(m.position === "sticky", `${label}: header sticky`, m.position);
  check(!m.reflowed, `${label}: tall fallback off`);
  // Scroll-width rounds to whole pixels, so a fitting row can report 1px.
  check(m.shellOverflow <= 1, `${label}: shell not clipped`, `overflow ${m.shellOverflow}`);
  check(m.actionsOverflow <= 1, `${label}: actions not clipped`, `overflow ${m.actionsOverflow}`);
  check(m.quoteHeight <= 46, `${label}: quote on one line`, `${m.quoteHeight}px`);
  if (m.nav) {
    check(m.nav.overflow <= 1, `${label}: nav not clipped`, `overflow ${m.nav.overflow}`);
    check(m.nav.height <= 34, `${label}: nav one row`, `${m.nav.height}px`);
  }
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(150);
  const top = await page.evaluate(() => Math.round(document.querySelector("header.site-header").getBoundingClientRect().top));
  check(top === 0, `${label}: header stays pinned`, `top ${top}`);
  check(errors.length === 0, `${label}: no page errors`, errors.join("; "));
  await context.close();
}

async function checkText200(width, lang) {
  const { context, page, errors } = await open(width, lang);
  await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
  try {
    await page.waitForFunction(
      () => document.documentElement.hasAttribute("data-header-reflowed"),
      null,
      { timeout: 15000 },
    );
  } catch {
    // The assertions below report the missing fallback without aborting the run.
  }
  await page.waitForTimeout(450); // the header transitions for 300ms
  await waitForStableShell(page);
  const m = await page.evaluate(measure);
  const label = `${width} ${lang} 200%`;
  check(m.reflowed, `${label}: reflow fallback applied`);
  check(m.position === "static", `${label}: header scrolls away`, m.position);
  check(m.headerHeightVar === "0px", `${label}: sub-nav offset cleared`, m.headerHeightVar);
  check(m.shellOverflow <= 1, `${label}: shell not clipped`, `overflow ${m.shellOverflow}`);
  check(m.actionsOverflow <= 1, `${label}: actions not clipped`, `overflow ${m.actionsOverflow}`);
  check(m.headerHeight <= textThresholds[width], `${label}: header stays compact`, `${m.headerHeight}px`);
  if (width >= 1280 && m.nav) {
    check(m.nav.overflow <= 1, `${label}: nav not clipped`, `overflow ${m.nav.overflow}`);
    check(m.nav.height <= 160, `${label}: nav no more than two rows`, `${m.nav.height}px`);
    check(m.actionsHeight <= 176, `${label}: actions no more than two rows`, `${m.actionsHeight}px`);
  }
  if (width <= 1024) {
    check(m.actionsHeight <= 200, `${label}: actions no more than three rows`, `${m.actionsHeight}px`);
  }
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(150);
  const top = await page.evaluate(() => Math.round(document.querySelector("header.site-header").getBoundingClientRect().top));
  check(top < -200, `${label}: reflowed header scrolls with the page`, `top ${top}`);
  check(errors.length === 0, `${label}: no page errors`, errors.join("; "));
  await context.close();
}

for (const width of [1440, 1280, 1024, 768, 390, 320]) await checkNormal(width, "de");
for (const width of [1440, 1280]) await checkNormal(width, "en");
for (const width of [1440, 1280, 1024, 768, 390]) await checkText200(width, "de");
for (const width of [1440, 1280]) await checkText200(width, "en");

/**
 * The 200% text layout must fit the viewport horizontally; anything wider gives
 * the whole document a horizontal scrollbar. Only elements that are not already
 * clipped by an ancestor can widen the document, so those are the ones named in
 * a failure. Decorative overflow inside `overflow-hidden` sections is fine.
 */
const measurePage = () => {
  const viewport = document.documentElement.clientWidth;
  const docOverflow = document.documentElement.scrollWidth - viewport;
  const offenders = [];
  if (docOverflow > 0) {
    const widened = [...document.querySelectorAll("body *")].filter((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || rect.right <= viewport + 1) return false;
      for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflowX !== "visible") return false;
      }
      return true;
    });
    for (const element of widened
      .filter((element) => !widened.some((other) => other !== element && other.contains(element)))
      .slice(0, 3)) {
      const rect = element.getBoundingClientRect();
      const classes = String(element.className).split(/\s+/).filter(Boolean).slice(0, 3).join(".");
      offenders.push(`${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""} right ${Math.round(rect.right)} of ${viewport}`);
    }
  }
  return { docOverflow, bodyOverflow: document.body.scrollWidth - viewport, viewport, offenders };
};

/** Page width also settles a few frames after a live font-size change. */
async function waitForStablePage(page, timeout = 4000) {
  const snapshot = () =>
    page.evaluate(() =>
      `${document.documentElement.scrollWidth}:${document.body.scrollWidth}:${document.documentElement.clientWidth}`,
    );
  const deadline = Date.now() + timeout;
  let previous = await snapshot();
  let stable = 0;
  while (Date.now() < deadline) {
    await page.waitForTimeout(100);
    const current = await snapshot();
    stable = current === previous ? stable + 1 : 0;
    previous = current;
    if (stable >= 2) return;
  }
}

async function checkPageOverflow(path, width, lang) {
  const { context, page, errors } = await open(width, lang, path);
  await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
  await page.waitForTimeout(450);
  await waitForStablePage(page);
  const m = await page.evaluate(measurePage);
  const label = `${path} ${width} ${lang} 200% page`;
  check(
    m.docOverflow === 0,
    `${label}: no horizontal overflow`,
    `document overflow ${m.docOverflow}${m.offenders.length ? `: ${m.offenders.join("; ")}` : ""}`,
  );
  check(errors.length === 0, `${label}: no page errors`, errors.join("; "));
  await context.close();
}

for (const path of ["/de", "/de/black-friday"]) {
  for (const width of [1440, 1280, 1024, 768, 390]) await checkPageOverflow(path, width, "de");
}
for (const width of [1440, 1280, 1024, 768, 390]) await checkPageOverflow("/en/black-friday", width, "en");

// A tall open menu is not a reflowed header; it must not disable sticky.
{
  const { context, page, errors } = await open(390, "de");
  await page.click("button[aria-controls='mobile-menu-nav']");
  await page.waitForTimeout(450);
  await waitForStableShell(page);
  const m = await page.evaluate(measure);
  check(!m.reflowed, "390 menu: open menu does not trip the fallback");
  check(m.position === "sticky", "390 menu: header stays sticky", m.position);
  check(m.shellOverflow <= 1, "390 menu: shell not clipped", `overflow ${m.shellOverflow}`);
  check(errors.length === 0, "390 menu: no page errors", errors.join("; "));
  await context.close();
}

// Hero deck: the front deal must rotate on its own, only the front card may be
// tabbed to, and the pause control must hold the stack still.
const deckState = () => {
  const deck = document.querySelector("[data-deal-deck]");
  if (!deck) return null;
  const front = deck.querySelector('[data-slot="front"]');
  return {
    frontId: front?.getAttribute("data-deal-id") ?? null,
    cards: deck.querySelectorAll(".bf-deck-card").length,
    tabbable: [...deck.querySelectorAll(".bf-deck-card a")].filter((link) => link.tabIndex >= 0).length,
    hasPause: Boolean(deck.querySelector('[data-deck-action="pause"]')),
  };
};

{
  const { context, page, errors } = await open(1440, "de");
  const first = await page.evaluate(deckState);
  await page.waitForTimeout(6200);
  const second = await page.evaluate(deckState);
  check(Boolean(first?.frontId), "deck: front card present", String(first?.frontId));
  check(second?.frontId !== first?.frontId, "deck: front deal advances on its own", `${first?.frontId} -> ${second?.frontId}`);
  check(first?.cards >= 2, "deck: renders a stack", String(first?.cards));
  check(first?.tabbable === 1, "deck: only the front card is tabbable", String(first?.tabbable));
  check(errors.length === 0, "deck: no page errors", errors.join("; "));
  await context.close();
}

{
  const { context, page } = await open(1440, "de");
  await page.click('[data-deck-action="pause"]');
  await page.mouse.move(4, 4);
  const paused = await page.locator('[data-deck-action="pause"]').getAttribute("aria-pressed");
  const before = await page.evaluate(deckState);
  await page.waitForTimeout(6500);
  const after = await page.evaluate(deckState);
  check(paused === "true", "deck: pause reports its state", String(paused));
  check(before?.frontId === after?.frontId, "deck: pause holds the front deal", `${before?.frontId} -> ${after?.frontId}`);
  await context.close();
}

{
  const { context, page } = await open(1440, "de", "/de", { reducedMotion: "reduce" });
  const first = await page.evaluate(deckState);
  await page.waitForTimeout(6500);
  const second = await page.evaluate(deckState);
  check(first?.frontId === second?.frontId, "deck: reduced motion stays still", `${first?.frontId} -> ${second?.frontId}`);
  check(first?.hasPause === false, "deck: reduced motion hides the pause control");
  await context.close();
}

// Header sting: hand first, wordmark second, one showing per session, and the
// campaign pill must remain the element the pointer hits.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem("apfel-theme", "mono");
    document.cookie = "apfel-theme=mono; path=/";
    localStorage.setItem("apfel-consent", "necessary");
    document.cookie = "apfel-consent=necessary; path=/";
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/de`, { waitUntil: "domcontentloaded" });

  const handShown = await page
    .waitForFunction(
      () => {
        const hand = document.querySelector("[data-bf-sting-hand]");
        return Boolean(hand) && Number(getComputedStyle(hand).opacity) > 0.5;
      },
      null,
      { timeout: 8000 },
    )
    .then(() => true)
    .catch(() => false);
  check(handShown, "sting: hand appears from the logo");

  const wordWaits = await page.evaluate(() => {
    const word = document.querySelector("[data-bf-sting-word]");
    return Boolean(word) && Number(getComputedStyle(word).opacity) < 0.2;
  });
  check(wordWaits, "sting: wordmark waits while the hand points");

  const targetHit = await page.evaluate(() => {
    const pill = [...document.querySelectorAll("[data-campaign-target]")].find(
      (element) => element.getClientRects().length > 0,
    );
    if (!pill) return false;
    const rect = pill.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + 6, rect.top + rect.height / 2);
    return Boolean(hit?.closest("[data-campaign-target]"));
  });
  check(targetHit, "sting: campaign pill stays hittable");

  const wordShown = await page
    .waitForFunction(
      () => {
        const word = document.querySelector("[data-bf-sting-word]");
        return Boolean(word) && Number(getComputedStyle(word).opacity) > 0.5;
      },
      null,
      { timeout: 6000 },
    )
    .then(() => true)
    .catch(() => false);
  check(wordShown, "sting: wordmark follows the hand");

  const cleared = await page
    .waitForFunction(() => !document.querySelector("[data-bf-sting-hand]"), null, { timeout: 9000 })
    .then(() => true)
    .catch(() => false);
  check(cleared, "sting: layer clears after the sequence");
  const flagged = await page.evaluate(() => sessionStorage.getItem("apfel-bf-sting") === "1");
  check(flagged, "sting: recorded for the session");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2600);
  const replay = await page.evaluate(() => Boolean(document.querySelector("[data-bf-sting-hand]")));
  check(!replay, "sting: does not replay in the same session");
  check(errors.length === 0, "sting: no page errors", errors.join("; "));
  await context.close();
}

// Evidence for review: the default header and the reflowed header.
for (const [name, width, lang, zoom, clip] of [
  ["header-normal-1440", 1440, "de", false, 200],
  ["header-text200-1440", 1440, "de", true, 400],
  ["header-text200-1280", 1280, "de", true, 360],
  ["header-text200-768", 768, "de", true, 400],
  ["header-text200-390", 390, "de", true, 360],
]) {
  const { context, page } = await open(width, lang);
  if (zoom) {
    await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
    await page.waitForFunction(
      () => document.documentElement.hasAttribute("data-header-reflowed"),
      null,
      { timeout: 15000 },
    );
    await page.waitForTimeout(450);
    await waitForStableShell(page);
  }
  await page.screenshot({ path: `${evidenceDir}/${name}.png`, clip: { x: 0, y: 0, width, height: clip } });
  await context.close();
}

await browser.close();
console.log(`[black-friday-qa] ${passed} passed, ${failures.length} failed; evidence in ${evidenceDir}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
