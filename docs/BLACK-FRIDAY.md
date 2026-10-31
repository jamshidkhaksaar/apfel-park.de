# Apfel Park Black Week campaign theme

Status: implemented on `feat/black-friday-theme`, **not deployed**.

## What the campaign changes

| Surface | Behaviour while the season is active |
| --- | --- |
| Every page | The dark token set is forced and repainted with the campaign palette (`data-season="black-friday"` on `<html>`): ink, warm bone, one signal red and brass hairlines borrowed from the logo. The light/dark toggle is hidden and the stored preference is left untouched. |
| Every page | A brass-ruled ribbon under the header carries **Apfel Park Black Week**, the end date and a link to the landing page. The desktop nav carries a red **Black Week** pill with an animated tag mark (also present in the mobile menu); legal links and the B2B entry move to the footer/menu while it runs so the bar still fits at 1280px. The pill is also present during the teaser, in a calmer outline treatment — see “Header entry”. |
| Every page | The discount popup is not mounted during the campaign. The landing page and the ribbon already are the offer surface; a second overlay would compete with them. |
| Home | The managed hero slider is replaced by the campaign masthead: the Black Week wordmark, a rotating discount seal, live countdown, one large deal dossier with two secondary plates, a trust row and an endless deal tape under the hero. |
| Store | A campaign band sits above the catalog; the `Nur Deals` toggle filters to offers with a real saving (`?deals=1`). The iPhone showcase banner is hidden for the duration. |
| Landing page | `/{de,en}/black-friday` is public from 26 October (teaser) and carries its own campaign masthead (`variant="landing"`): breadcrumb instead of the studio meta line, an “Apfel Park” lockup above the wordmark, a hub deck, a jump-to-deals CTA, and an “Direkt im Shop” block with the real address, opening hours and phone. Below it: the eight-day schedule, an animated deal explorer (category tabs, brand tabs with monochrome logos, device/accessory/condition/price filters, deal grid), a trust section that links the real condition and FAQ pages, how-it-works, FAQ, store CTA, `ItemList`/`FAQPage` structured data and a share card. Before the sale opens it counts down to launch and makes no deal claims — see “Teaser phase”. |
| Admin | `/admin/products/promotions` has a Black Friday selection panel: tick products for the landing page and the home hero. Stored in `store_settings` key `black_friday_selection`; no schema change. |
| Sitemap | The landing page is listed only while the campaign is active. |

## Naming and URLs

The campaign is presented as **Apfel Park Black Week** (23–30 November 2026),
with **Black Friday on 27 November** and **Cyber Monday on 30 November** as the
named days inside it. The landing page keeps the `/black-friday` URL because it
is the search term and the URL already used in ads; `/black-week` redirects to
it for printed or hand-typed links. Metadata keeps both names: “Black Week 2026
– Black Friday Angebote”.

## Art direction

- Ink `#08080a`, bone `#f2ede4`, signal red `#e8172c`, brass `#c9a96a`,
  paper `#f2ece2`. Red is the only action colour; brass is a hairline accent
  borrowed from the logo.
- Sora for the display type, Inter for body copy, mono only for numbers, dates
  and labels. No additional font is loaded for the campaign.
- Motion is decorative and CSS-only: the seal tick ring, the ticket mark in the
  header and the deal tape. All of it stops under `prefers-reduced-motion`.
- The header ticket mark is painted white whenever it sits inside the red pill,
  so the animated tag stays visible in both the active and hover state.
- Micro labels that carry campaign facts (the end-date note, the countdown cell
  labels) stay at 50 % white or more; only purely decorative type goes fainter.
- Trust beats urgency. The seal, the hero line and the cards read the same live
  saving; there are no hardcoded percentages, fake stock counts or evergreen
  countdowns.

## Teaser phase (26 October – 22 November)

The landing page is public four weeks before the sale so teaser ads and owner
review have a destination. Nothing is on sale in that phase, and the page says
so instead of guessing:

- The countdown targets `blackFriday.startsAt` (23 November, 00:00 Berlin) and is
  labelled **“Black Week startet in”**; its accessible name is “Black Week startet
  am 23. November um 00:00 Uhr”. The seal reads **START / 23.11.**, never a
  percentage.
- The saving row reads “Startschuss am 23. November · Bis dahin gelten die
  regulären Preise.” No “Angebote enden in”, no “Live”, no discounted hero claim.
- The primary CTA is **“Ablauf ansehen”** and jumps to the week schedule; the
  secondary CTA is the normal shop.
- Product cards are real stock at today’s prices, under **“Aktuell im Shop”** /
  **“Schon jetzt im Shop”**, with a note that Black Week actions start on 23
  November. The deal explorer stays usable, but no `ItemList` of “deals” is
  emitted before the sale.
- The site-wide theme stays normal (no ribbon, no campaign palette, normal
  chrome). The landing route carries `data-season="black-friday"` on its own
  wrapper, so the campaign tokens apply to the page only; the header and footer
  keep their normal appearance. The one campaign element outside the route is the
  header entry described below.
- The discount popup is suppressed on the route in both phases.
- Metadata uses `metaDescriptionBefore`; canonical stays `/black-friday`.

## Header entry

The **Black Week** link follows `getCampaignPhase()`, not the site-wide theme, so
the page is findable as soon as it exists:

| Phase | Desktop nav | Mobile menu | Spoken label |
| --- | --- | --- | --- |
| `off`, `after` | no entry | no entry | — |
| `before` | outline pill, red tag mark, launch date `23.11.` from 1600px | tinted row with `23.11.` | “Black Week startet am 23. November um 00:00 Uhr” |
| `live` | solid red pill, no date | tinted row with `27.11.` | visible text only |

Before the sale the pill sits on whatever surface the visitor chose: it uses
`--signal` for the mark and border and `--foreground` for the label, so it is
readable on the light and dark theme alike. It never uses the solid red “live”
treatment before launch, and the date badge is hidden below 1600px where the nav
has no room for it. `Firmenkunden` and the two legal links leave the desktop bar
while the entry runs (they remain in the mobile menu and the footer); without
that, the bar overflows its rounded shell at 1280px by ~63px.

Phones never see the pill, so the teaser also gets a compact **Black Week 23.11.**
link at the right end of the existing utility bar (below `md`). It is part of the
header, adds no height and disappears at `md`, where the contact details need the
space. The date drops below 360px; the link reuses the same accessible name. To
keep the bar on one line at 320–390px, the secondary “Abholung in Wilhelmsburg”
note is hidden below `sm` **only while the teaser runs** — it returns with the
live phase, when the ribbon carries the campaign instead. The top-bar link is not
shown during `live`.

Tablets from `md` to just below `xl` (768–1279) get a compact outline pill in the
header's action row, between the quote button and the cart. It carries the same
animated tag and launch date, uses the same accessible name, and disappears at
1280 where the desktop nav pill takes over. It is also teaser-only. The three
ranges therefore hand off cleanly: utility bar below 768, action-row pill from
768 to 1279, nav pill from 1280.

Between `md` and `lg` (768–1023) the utility bar stays on one line by dropping
the secondary “Abholung in Wilhelmsburg” note and shortening only the opening
hours to “Mo–Sa 09:30 – 20:00” / “Mon–Sat 09:30 – 20:00”. Both phone numbers stay
in full. The note and the long hours (“Montag – Samstag · 09:30 – 20:00” /
“Monday – Saturday · …”) return at `lg`, where the bar has room for them. The
note is hidden in that range in every phase, not just during the campaign, so the
bar measures 32px instead of 48px at 768 for the normal site too. Below `md` the
bar keeps its previous behaviour.

The bar is not forced onto one line with `white-space: nowrap`. The content fits
naturally at 768–1023 (62–125px spare), so it stays on one line without that
constraint; at 200% text-only scaling the contact groups wrap onto extra rows
instead of overflowing, and each phone number stays unbroken. Browser zoom at
200% halves the layout viewport and still gives a 32px one-line bar at every
window size tested.

## Large text

At 200% text scaling the header reflows instead of clipping. The nav and the
action row both wrap inside the rounded shell (`min-w-0` + `flex-wrap`); the nav
uses a content basis (`grow`, not `flex-1`) so the two sides share the width, and
the quote button may wrap its label. Normal nav padding below `2xl` is 2px, which
keeps the full off-season bar on one row at 1280 as well.

When the top bar plus shell exceeds 200px, the header sets
`data-header-reflowed` and becomes `position: static`, so it scrolls away instead
of pinning several rows over the page; `--site-header-h` drops to 0 so sticky
sub-navigations sit at the top. At normal sizes the header stays sticky. An open
mobile menu is not counted toward that height. At 200% text the shell is 170px at
1440/1280 (two nav rows, two action rows), 194px at 768 and 186px at 390, with no
header clipping.

The page itself also reflows at that setting: the document no longer scrolls
horizontally. Decorative overflow (hero glows, the deal marquee) stays inside its
`overflow-hidden` sections. Text can break inside long compounds only when the
box is narrower than the word (`overflow-wrap: break-word` on `body`), which is
what happens at phone widths. The footer grid tracks use `minmax(0, …)` so they
may shrink below their content, its payment icons wrap, the TRUSMI logo column is
capped at 45% beside its copy, and the home service, process and deal-filter rows
let their flex/grid children shrink (`min-w-0`, `max-w-full`, `flex-wrap`).

### Header and reflow QA

`npm run qa:black-friday` drives a built preview and fails on any header
regression:

```bash
QA_BASE_URL=http://127.0.0.1:3108 \
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright \
npm run qa:black-friday
```

The script checks the normal header at 320, 390, 768, 1024, 1280 and 1440 (DE,
plus 1280/1440 in EN): sticky, tall fallback off, one nav row, and zero clipping
in the shell, nav or action row (within 1px, since scroll widths round). Then it
sets the root font size to 32px and
requires the reflowed state: `data-header-reflowed` set, header `static`,
`--site-header-h` reset to 0, at most two nav rows, no shell/nav/action clipping,
and no pinned header after scrolling. An open mobile menu at 390 must **not**
trip the fallback.

At the same 32px root it checks the whole document on `/de`, `/de/black-friday`
and `/en/black-friday` at 1440, 1280, 1024, 768 and 390: `scrollWidth` must equal
`clientWidth`, so no horizontal scrollbar appears. A failure names the outermost
unclipped element that widens the page, ignoring decorative overflow inside an
`overflow-hidden` ancestor. Screenshots go to `EVIDENCE_DIR` (default
`/tmp/apfel-black-friday-qa`); the process exits non-zero on any failure.

A live font-size change runs through the header's 300ms transition and can clip
a row for a few frames before it wraps. The script waits for `document.fonts` and
for the shell and page geometry to stop changing, then asserts on the settled
layout, which is how a visitor who set 200% text before loading sees the page. Playwright is resolved
from `PLAYWRIGHT_MODULE` because the deploy host keeps it outside the app's
dependencies. Like the other browser tests, this is not part of `ci:check`; it
needs a built server.

## Activation

`src/lib/seasonal-theme.ts` owns two separate switches:

`getActiveSeasonalTheme()` — the site-wide takeover:

- unset — active from **23 November 2026 00:00** to **30 November 2026 23:59**
  (Europe/Berlin, the Cyber Monday end date)
- `black-friday` — force the campaign theme on (previews, early launch)
- `off` — keep it off regardless of the calendar

`getCampaignPhase()` — whether `/black-friday` exists and what it claims:

| Phase | Window (Europe/Berlin) | Page | Claims |
| --- | --- | --- | --- |
| `off` | before 26 Oct 2026 00:00, or `APFEL_SEASON=off` | 404 | — |
| `before` | 26 Oct – 22 Nov 2026 | 200 | countdown to launch, regular prices |
| `live` | 23 Nov 00:00 – 30 Nov 23:59 | 200 | sale offers, countdown to end |
| `after` | from 1 Dec 2026 00:00 | 404 | — |

The header entry and the sitemap follow `getCampaignPhase()`; the dark takeover,
ribbon and store band follow `getActiveSeasonalTheme()`. That split is what lets
the teaser page exist in a normal-looking shop. Set the environment in the app's
env file and restart; no rebuild is needed.

### Owner switch in the admin

Admin → Einstellungen → **Black Week** stores the owner's choice in
`store_settings.campaign` (`{ mode: "auto" | "on" | "off" }`). It needs no
.env edit and no restart; the next request picks it up.

| Mode | Theme | Campaign page | Source |
| --- | --- | --- | --- |
| Automatisch (default) | `APFEL_SEASON`, else the calendar | calendar | `APFEL_SEASON` or calendar |
| Jetzt aktivieren | immediately, until 30 Nov 23:59 | calendar (teaser, then sale) | admin |
| Aus | off | 404 | admin |

The admin choice wins over an `APFEL_SEASON=black-friday` override, so staff can
switch the takeover on for a launch week and off again without a deploy. Two
limits keep it safe:

- `APFEL_SEASON=off` is still a hard kill: `on` cannot override it.
- `on` does not move sale claims. Before 23 November the page stays the teaser
  with regular prices and a countdown; the offers appear only inside the live
  window. After 30 November the theme switches itself off, even if `on` is left
  selected.

The settings card also shows the resolved status (theme, page phase, source) so
the effect of a change is visible before leaving the page. The environment
variables remain available for staging and for a deployment-level kill switch.
An unknown `APFEL_SEASON` value does not activate the theme.

Because `on` decouples the takeover from the phase, every campaign surface reads
the phase, not just the landing page. Before 23 November the homepage masthead
uses the teaser copy and counts down to the launch (its CTA goes to
`/black-friday#week`), the deals grid is labelled “Schon jetzt im Shop / Verfügbare
Geräte”, and the ribbon shows `Start 23.11.` instead of a countdown to an end
that has not started. In the live window the same components switch to the sale
copy automatically. This keeps an early activation from publishing a sale claim
a month early.

`APFEL_CAMPAIGN_PHASE=before|live|after` is a **preview-only** override for
reviewing the three landing-page states outside their dates. It is ignored when
`APFEL_SEASON=off`, unknown values fall back to the calendar, and production
leaves it unset. The site-wide theme is not affected by it.

## Content and deals

- Copy, dates and FAQ: `src/lib/black-friday.ts`.
- Deals are not a separate list. `getBlackFridayDeals()` in `src/lib/products.ts`
  selects in-stock products with a `compareAtPrice`, groups colour/storage
  families, and sorts by saving. A product without a real saving cannot appear.
- The hero's percentage, the homepage section and the landing page all read the
  same query, so the number in the headline matches the cards.

## Deal selection

The campaign panel under Produkte → Popup-Aktion writes
`store_settings.black_friday_selection` with `pageIds` and `heroIds`. The deal
query floats curated ids to the top and keeps them even when their saving is not
in the current top slice; products without a real saving are still excluded from
the automatic part. Prices and the displayed saving continue to come from the
product's `price` and `compare_at_price`, so campaign cards, product pages and
checkout always agree. If no selection exists, the page stays fully automatic.

## Share card

`public/images/black-friday/black-week-2026-og.png` (1200x630) is referenced by
the landing page metadata. The dynamic `opengraph-image` route is not generated
inside the `[lang]` segment by Next 16, so this is a static asset: regenerate it
when the dates, headline or logo change. It is deliberately typographic (ink,
bone, signal red, brass) and carries the original logo, so it reads the same as
the page when used as a Facebook, Instagram or Google ad preview.

## Home vs landing masthead

Both render `BlackFridayHero`; the landing page passes `variant="landing"` so the
hub does not repeat the homepage word-for-word. The landing variant swaps the
studio meta line for a breadcrumb, adds the “Apfel Park — Black Week” lockup,
uses the hub deck, points its primary CTA at the deal explorer (`#deals`) and
replaces the four trust ticks with a store block built from `siteInfo`. The
homepage keeps the trust ticks and the short lede. Dates in the right-hand meta
line are hidden below `sm`, where the ribbon already carries them.

## Hero deck and header sting

The masthead's right column is `BlackFridayDealDeck`: a three-card window over
the campaign list. Only the front card is interactive. Every 5.2 s it lifts
forward, drops onto the back of the pile and the next deal rises; the same
motion runs manually through the previous/next buttons. Auto-advance stops on
hover, focus, a hidden tab and when the deck is off-screen. With
`prefers-reduced-motion` it swaps instantly and the pause control disappears.
The pause button is the WCAG 2.2.2 control; the hairline above the dots shows
the dwell.

`BlackWeekSting` plays once per session on the first page view above 1280 px: a
hand slides out of the logo and taps the campaign pill, then a BLACK WEEK
wordmark wipes out from behind the logo and retracts. It lives in a clipped
layer inside the navbar shell, so it cannot widen the header; it never receives
pointer events and is hidden entirely at 200% text and with reduced motion. The
session key is `apfel-bf-sting`.

`scripts/black-friday-qa.mjs` covers both: rotation, pause, reduced motion,
sting order, the campaign-pill hit test and a reload that must not replay.

## Before enabling

1. `npm run typecheck`
2. Confirm the teaser copy on `/de/black-friday` (start date, “reguläre Preise”)
3. `npm test`
4. `npm run build`
5. Check `/{lang}/black-friday` in `before` and `live` and `/{lang}/store?deals=1`
   with the env override, then repeat from Admin → Einstellungen with `on` and
   `off` (and `auto` again). On the homepage, confirm the nav entry disappears
   with `APFEL_SEASON=off`, with the admin `off` mode, and with
   `APFEL_CAMPAIGN_PHASE=after`, and that the bar has no horizontal overflow at
   1280px in both states.
6. Confirm the advertised maximum discount matches the current offers.
7. Run `npm run qa:black-friday` against the built preview; the 200% text checks
   must pass in DE and EN.

## After the window

Unset `APFEL_SEASON` (or set `off`). The site returns to the normal theme, the
ribbon and band disappear, and the landing page 404s. The stored light/dark
choice was never modified, so it applies again immediately.
